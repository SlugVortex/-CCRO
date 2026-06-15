import { useEffect, useMemo, useRef, useState } from 'react'

import type { RegionRisk } from '@/types/climate'

type RiskAtlasProps = {
  regions: RegionRisk[]
  activeRegionId?: string
  countryCode?: string
  onSelect: (regionId: string) => void
  mode: 'baseline' | 'scenario'
  variant?: 'embedded' | 'expanded'
  onOpenLargeMap?: () => void
}

type Coordinate = [number, number]
type AtlasMetric = 'risk' | 'people' | 'loss'
type SvgPoint = { x: number; y: number }

type CountryViewport = {
  center: Coordinate
  zoom: number
  west: number
  east: number
  south: number
  north: number
}

const bandColors: Record<string, string> = {
  Critical: '#d1495b',
  High: '#f07f46',
  Moderate: '#f6bd60',
  Watch: '#84a59d',
  Stable: '#3c6e71',
}

const countryViewports: Record<string, CountryViewport> = {
  JM: {
    center: [-77.3, 18.1],
    zoom: 7.2,
    west: -78.5,
    east: -76.15,
    south: 17.7,
    north: 18.55,
  },
  BB: {
    center: [-59.56, 13.15],
    zoom: 10.4,
    west: -59.67,
    east: -59.42,
    south: 13.03,
    north: 13.34,
  },
  DM: {
    center: [-61.37, 15.42],
    zoom: 9.2,
    west: -61.52,
    east: -61.22,
    south: 15.2,
    north: 15.65,
  },
}

const svgViewport = {
  left: 20,
  top: 28,
  width: 520,
  height: 304,
}

const staticSnapshotDimensions = {
  width: 1200,
  height: 820,
}

const mercatorTileSize = 512

let atlasLoaderPromise: Promise<void> | null = null

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
const atlasMetricLabels: Record<AtlasMetric, string> = {
  risk: 'Risk',
  people: 'People',
  loss: 'Loss',
}

const resolveMapStyle = () => (document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'night' : 'road')
const getAtlas = () => (window as Window & { atlas?: any }).atlas

const summarizeMapError = (message?: string) => {
  if (!message) {
    return 'Using Azure Maps static fallback while the live map is unavailable.'
  }

  if (message.includes('_addEventListener')) {
    return 'Interactive map controls are restarting. Showing Azure Maps static fallback for the moment.'
  }

  if (message.toLowerCase().includes('timed out')) {
    return 'Azure Maps took too long to initialize. Showing Azure Maps static fallback.'
  }

  return 'Using Azure Maps static fallback while the live map is unavailable.'
}

const extractRegionIdFromShape = (shape: any) => shape?.getProperties?.()?.regionId ?? shape?.properties?.regionId ?? null

const getSnapshotZoom = (zoom: number) => Math.min(20, Math.max(1, Math.round(zoom + 1)))
const getFocusZoom = (zoom: number) => Math.min(20, Math.max(getSnapshotZoom(zoom) + 1, 9))

const toLegacyCoordinate = (region: RegionRisk, countryCode?: string): Coordinate => {
  const viewport = countryViewports[countryCode ?? 'JM'] ?? countryViewports.JM
  const xRatio = clamp((region.map_position.x + region.map_position.w / 2 - svgViewport.left) / svgViewport.width)
  const yRatio = clamp((region.map_position.y + region.map_position.h / 2 - svgViewport.top) / svgViewport.height)
  const longitude = viewport.west + xRatio * (viewport.east - viewport.west)
  const latitude = viewport.north - yRatio * (viewport.north - viewport.south)
  return [longitude, latitude]
}

const resolveCoordinate = (region: RegionRisk, countryCode?: string): Coordinate => {
  if (region.map_coordinate) {
    return [region.map_coordinate.lng, region.map_coordinate.lat]
  }

  return toLegacyCoordinate(region, countryCode)
}

const mercatorProject = ([longitude, latitude]: Coordinate, zoom: number): SvgPoint => {
  const worldSize = mercatorTileSize * 2 ** zoom
  const clampedLatitude = clamp(latitude, -85.05112878, 85.05112878)
  const sinLatitude = Math.sin((clampedLatitude * Math.PI) / 180)

  return {
    x: ((longitude + 180) / 360) * worldSize,
    y: (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * worldSize,
  }
}

const projectCoordinateToSvg = (coordinate: Coordinate, viewport: CountryViewport, zoom: number): SvgPoint => {
  const point = mercatorProject(coordinate, zoom)
  const center = mercatorProject(viewport.center, zoom)
  const screenX = staticSnapshotDimensions.width / 2 + (point.x - center.x)
  const screenY = staticSnapshotDimensions.height / 2 + (point.y - center.y)
  const scale = Math.max(
    svgViewport.width / staticSnapshotDimensions.width,
    svgViewport.height / staticSnapshotDimensions.height,
  )
  const renderedWidth = staticSnapshotDimensions.width * scale
  const renderedHeight = staticSnapshotDimensions.height * scale
  const offsetX = svgViewport.left + (svgViewport.width - renderedWidth) / 2
  const offsetY = svgViewport.top + (svgViewport.height - renderedHeight) / 2

  return {
    x: clamp(offsetX + screenX * scale, svgViewport.left + 10, svgViewport.left + svgViewport.width - 10),
    y: clamp(offsetY + screenY * scale, svgViewport.top + 10, svgViewport.top + svgViewport.height - 10),
  }
}

const getRegionAnchorPoint = (
  region: RegionRisk,
  viewport: CountryViewport,
  snapshotZoom: number,
  countryCode?: string,
): SvgPoint => {
  if (region.map_coordinate) {
    return projectCoordinateToSvg(resolveCoordinate(region, countryCode), viewport, snapshotZoom)
  }

  return {
    x: region.map_position.x + region.map_position.w / 2,
    y: region.map_position.y + region.map_position.h / 2,
  }
}

const toOverlayPosition = (anchor: SvgPoint) => ({
  left: `${clamp((anchor.x - svgViewport.left) / svgViewport.width) * 100}%`,
  top: `${clamp((anchor.y - svgViewport.top) / svgViewport.height) * 100}%`,
})

const getExpandedCardPosition = (region: RegionRisk, anchor: SvgPoint) => {
  const preferredX = anchor.x + 16
  const preferredY = anchor.y - region.map_position.h - 18

  return {
    x: clamp(preferredX, svgViewport.left + 10, svgViewport.left + svgViewport.width - region.map_position.w - 10),
    y: clamp(preferredY, svgViewport.top + 10, svgViewport.top + svgViewport.height - region.map_position.h - 10),
    w: region.map_position.w,
    h: region.map_position.h,
  }
}

const getConnectorPoint = (card: { x: number; y: number; w: number; h: number }, anchor: SvgPoint): SvgPoint => ({
  x: clamp(anchor.x, card.x + 10, card.x + card.w - 10),
  y: clamp(anchor.y, card.y + 10, card.y + card.h - 10),
})

const formatRiskScore = (value: number) => (Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1))

const formatAtlasMetricValue = (region: RegionRisk, metric: AtlasMetric) => {
  switch (metric) {
    case 'people':
      return compactNumberFormatter.format(region.people_at_risk)
    case 'loss':
      return `$${region.expected_loss_musd.toFixed(0)}M`
    case 'risk':
    default:
      return formatRiskScore(region.risk_score)
  }
}

const loadAzureMapsSdk = async () => {
  if (getAtlas()?.Map) {
    return
  }

  if (!atlasLoaderPromise) {
    atlasLoaderPromise = new Promise<void>((resolve, reject) => {
      const cssId = 'ccro-atlas-css'
      const scriptId = 'ccro-atlas-sdk'

      if (!document.getElementById(cssId)) {
        const link = document.createElement('link')
        link.id = cssId
        link.rel = 'stylesheet'
        link.href = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css'
        document.head.appendChild(link)
      }

      const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true })
        existingScript.addEventListener('error', () => reject(new Error('Azure Maps SDK failed to load.')), { once: true })
        return
      }

      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Azure Maps SDK failed to load.'))
      document.body.appendChild(script)
    })
  }

  await atlasLoaderPromise
}

const RiskAtlas = ({
  regions,
  activeRegionId,
  countryCode,
  onSelect,
  mode,
  variant = 'embedded',
  onOpenLargeMap,
}: RiskAtlasProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const mapReadyRef = useRef(false)
  const mainSourceRef = useRef<any>(null)
  const activeSourceRef = useRef<any>(null)
  const bubbleLayerRef = useRef<any>(null)
  const readyTimeoutRef = useRef<number | null>(null)
  const [liveMapReady, setLiveMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [fallbackZoom, setFallbackZoom] = useState(1)
  const [atlasMetric, setAtlasMetric] = useState<AtlasMetric>('risk')
  const mapsKey = import.meta.env.VITE_AZURE_MAPS_KEY

  const activeRegion = regions.find((item) => item.id === activeRegionId) ?? regions[0]
  const viewport = countryViewports[countryCode ?? 'JM'] ?? countryViewports.JM
  const hasLiveMaps = Boolean(mapsKey)
  const snapshotZoom = getSnapshotZoom(viewport.zoom)
  const focusZoom = getFocusZoom(viewport.zoom)
  const hotspotRegions = useMemo(
    () => [...regions].sort((left, right) => right.risk_score - left.risk_score).slice(0, 6),
    [regions],
  )

  const regionCoordinates = useMemo(
    () =>
      Object.fromEntries(
        regions.map((region) => [region.id, resolveCoordinate(region, countryCode)]),
      ) as Record<string, Coordinate>,
    [countryCode, regions],
  )
  const regionAnchorPoints = useMemo(
    () =>
      Object.fromEntries(
        regions.map((region) => [region.id, getRegionAnchorPoint(region, viewport, snapshotZoom, countryCode)]),
      ) as Record<string, SvgPoint>,
    [countryCode, regions, snapshotZoom, viewport],
  )
  const overlayPositions = useMemo(
    () =>
      Object.fromEntries(
        regions.map((region) => [region.id, toOverlayPosition(regionAnchorPoints[region.id])]),
      ) as Record<string, { left: string; top: string }>,
    [regionAnchorPoints, regions],
  )

  const staticMapUrl = useMemo(() => {
    if (!mapsKey) {
      return ''
    }

    const params = new URLSearchParams({
      'api-version': '2024-04-01',
      center: `${viewport.center[0]},${viewport.center[1]}`,
      zoom: String(snapshotZoom),
      width: '1200',
      height: '820',
      layer: 'basic',
      style: 'main',
      'subscription-key': mapsKey,
    })

    return `https://atlas.microsoft.com/map/static?${params.toString()}`
  }, [mapsKey, snapshotZoom, viewport.center])

  const focusMapUrl = useMemo(() => {
    if (!mapsKey || !activeRegion) {
      return staticMapUrl
    }

    const focusCenter = regionCoordinates[activeRegion.id] ?? viewport.center
    const params = new URLSearchParams({
      'api-version': '2024-04-01',
      center: `${focusCenter[0]},${focusCenter[1]}`,
      zoom: String(focusZoom),
      width: '1400',
      height: '900',
      layer: 'basic',
      style: 'main',
      'subscription-key': mapsKey,
    })

    return `https://atlas.microsoft.com/map/static?${params.toString()}`
  }, [activeRegion, focusZoom, mapsKey, regionCoordinates, staticMapUrl, viewport.center])

  const handleResetView = () => {
    if (!mapRef.current) {
      setFallbackZoom(1)
      return
    }

    mapRef.current.setCamera({
      center: viewport.center,
      zoom: viewport.zoom,
      type: 'ease',
      duration: 500,
    })
  }

  const handleFallbackZoomIn = () => setFallbackZoom((current) => Math.min(2.4, Number((current + 0.2).toFixed(2))))
  const handleFallbackZoomOut = () => setFallbackZoom((current) => Math.max(1, Number((current - 0.2).toFixed(2))))

  useEffect(() => {
    setFallbackZoom(1)
  }, [countryCode])

  useEffect(() => {
    if (!mapContainerRef.current) {
      return
    }

    if (!hasLiveMaps) {
      setLiveMapReady(false)
      setMapError('Vite Azure Maps key is missing. Restart the frontend after updating VITE_AZURE_MAPS_KEY.')
      return
    }

    let disposed = false
    let atlasMap: any | null = null

    const initializeMap = async () => {
      try {
        await loadAzureMapsSdk()
        const atlas = getAtlas()
        if (disposed || !mapContainerRef.current || !atlas?.Map) {
          return
        }

        if (mapRef.current) {
          mapReadyRef.current = true
          setLiveMapReady(true)
          setMapError(null)
          return
        }

        atlasMap = new atlas.Map(mapContainerRef.current, {
          center: viewport.center,
          zoom: viewport.zoom,
          style: resolveMapStyle(),
          view: 'Auto',
          language: 'en-US',
          authOptions: {
            authType: 'subscriptionKey',
            subscriptionKey: mapsKey,
          },
        })

        mapRef.current = atlasMap
        readyTimeoutRef.current = window.setTimeout(() => {
          if (!disposed && !liveMapReady) {
            setMapError('Azure Maps timed out while initializing. Restart `npm run dev` and hard-refresh the page.')
          }
        }, 10000)

          atlasMap.events.add('ready', () => {
            if (disposed) {
              return
            }
          if (readyTimeoutRef.current) {
            window.clearTimeout(readyTimeoutRef.current)
            readyTimeoutRef.current = null
          }
            const controls = []
            if (atlas.control?.ZoomControl) {
              controls.push(new atlas.control.ZoomControl())
            }
            if (atlas.control?.FullscreenControl) {
              controls.push(new atlas.control.FullscreenControl())
            }
            if (controls.length > 0) {
              atlasMap.controls.add(controls, {
                position: 'top-right',
              })
            }

            const mainSource = new atlas.source.DataSource()
            const activeSource = new atlas.source.DataSource()
            atlasMap.sources.add(mainSource)
            atlasMap.sources.add(activeSource)

            const bubbleLayer = new atlas.layer.BubbleLayer(mainSource, 'ccro-risk-bubbles', {
              color: ['get', 'markerColor'],
              radius: ['get', 'markerRadius'],
              strokeColor: '#ffffff',
              strokeWidth: 2,
              opacity: 0.9,
            })
            atlasMap.layers.add(bubbleLayer)

            atlasMap.layers.add(
              new atlas.layer.SymbolLayer(mainSource, 'ccro-risk-symbols', {
                iconOptions: {
                  image: 'none',
                },
                textOptions: {
                  textField: ['get', 'shortLabel'],
                  offset: [0, 1.6],
                  size: 12,
                  color: '#102436',
                  haloColor: 'rgba(255,255,255,0.9)',
                  haloWidth: 1,
                },
              }),
            )

            atlasMap.layers.add(
              new atlas.layer.BubbleLayer(activeSource, 'ccro-risk-bubbles-active', {
                color: ['get', 'markerColor'],
                radius: ['get', 'markerRadius'],
                strokeColor: '#ffffff',
                strokeWidth: 4,
                opacity: 0.98,
              }),
            )

            const handleFeatureSelect = (event: { shapes?: any[] }) => {
              const shape = event?.shapes?.[0]
              const regionId = extractRegionIdFromShape(shape)
              if (regionId) {
                onSelect(regionId)
              }
            }

            const setMapCursor = (cursor: string) => {
              const container = atlasMap.getCanvasContainer?.() ?? mapContainerRef.current
              if (container?.style) {
                container.style.cursor = cursor
              }
            }

            atlasMap.events.add('click', bubbleLayer, handleFeatureSelect)
            atlasMap.events.add('click', 'ccro-risk-bubbles-active', handleFeatureSelect)
            atlasMap.events.add('click', 'ccro-risk-symbols', handleFeatureSelect)

            atlasMap.events.add('mouseenter', bubbleLayer, () => setMapCursor('pointer'))
            atlasMap.events.add('mouseenter', 'ccro-risk-bubbles-active', () => setMapCursor('pointer'))
            atlasMap.events.add('mouseenter', 'ccro-risk-symbols', () => setMapCursor('pointer'))
            atlasMap.events.add('mouseleave', bubbleLayer, () => setMapCursor('grab'))
            atlasMap.events.add('mouseleave', 'ccro-risk-bubbles-active', () => setMapCursor('grab'))
            atlasMap.events.add('mouseleave', 'ccro-risk-symbols', () => setMapCursor('grab'))

            mainSourceRef.current = mainSource
            activeSourceRef.current = activeSource
            bubbleLayerRef.current = bubbleLayer
            mapReadyRef.current = true
            setLiveMapReady(true)
            setMapError(null)
            window.requestAnimationFrame(() => {
              atlasMap.resize?.()
            })
        })

        atlasMap.events.add('error', (event: { error?: { message?: string } }) => {
          if (disposed) {
            return
          }
          if (mapReadyRef.current) {
            console.warn('Azure Maps non-fatal runtime error:', event?.error)
            return
          }
          if (readyTimeoutRef.current) {
            window.clearTimeout(readyTimeoutRef.current)
            readyTimeoutRef.current = null
          }
          setLiveMapReady(false)
          console.error('Azure Maps runtime error:', event?.error)
          setMapError(summarizeMapError(event?.error?.message))
        })
      } catch (error) {
        setLiveMapReady(false)
        const message = error instanceof Error ? error.message : 'Azure Maps could not be initialized.'
        console.error('Azure Maps initialization error:', error)
        setMapError(summarizeMapError(message))
      }
    }

    void initializeMap()

    return () => {
      disposed = true
      if (readyTimeoutRef.current) {
        window.clearTimeout(readyTimeoutRef.current)
        readyTimeoutRef.current = null
      }
      if (atlasMap?.dispose) {
        atlasMap.dispose()
      } else if (atlasMap?.remove) {
        atlasMap.remove()
      }
      if (mapRef.current === atlasMap) {
        mapRef.current = null
      }
      mapReadyRef.current = false
      if (bubbleLayerRef.current) {
        bubbleLayerRef.current = null
      }
    }
  }, [hasLiveMaps, mapsKey])

  useEffect(() => {
    if (!liveMapReady || !mapRef.current) {
      return
    }

    window.requestAnimationFrame(() => {
      mapRef.current?.resize?.()
      mapRef.current?.setStyle?.({ style: resolveMapStyle() })
      mapRef.current?.setCamera({
        center: viewport.center,
        zoom: viewport.zoom,
        type: 'ease',
        duration: 600,
      })
    })
  }, [liveMapReady, viewport.center, viewport.zoom])

  useEffect(() => {
    if (!liveMapReady || !mapRef.current) {
      return
    }

    const observer = new MutationObserver(() => {
      mapRef.current?.setStyle?.({ style: resolveMapStyle() })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-bs-theme'],
    })

    return () => observer.disconnect()
  }, [liveMapReady])

  useEffect(() => {
    const atlas = getAtlas()
    if (!liveMapReady || !mapRef.current || !atlas?.data || !activeRegion || !mainSourceRef.current || !activeSourceRef.current) {
      return
    }

    const atlasMap = mapRef.current
    mainSourceRef.current.clear()
    activeSourceRef.current.clear()

    const features = regions.map((region) => {
      const isActive = region.id === activeRegion.id
      return new atlas.data.Feature(new atlas.data.Point(regionCoordinates[region.id]), {
        regionId: region.id,
        shortLabel: `${region.name}\n${formatAtlasMetricValue(region, atlasMetric)}`,
        markerColor: bandColors[region.risk_band] || '#84a59d',
        markerRadius: isActive ? 18 : 12,
      })
    })

    const activeFeature = new atlas.data.Feature(new atlas.data.Point(regionCoordinates[activeRegion.id] ?? viewport.center), {
      regionId: activeRegion.id,
      shortLabel: `${activeRegion.name}\n${formatAtlasMetricValue(activeRegion, atlasMetric)}`,
      markerColor: bandColors[activeRegion.risk_band] || '#84a59d',
      markerRadius: 18,
    })
    mainSourceRef.current.add(features)
    activeSourceRef.current.add(activeFeature)

    atlasMap.setCamera({
      center: regionCoordinates[activeRegion.id] ?? viewport.center,
      zoom: Math.max(viewport.zoom, 8.3),
      type: 'ease',
      duration: 750,
    })
    atlasMap.resize?.()
  }, [activeRegion, atlasMetric, liveMapReady, onSelect, regionCoordinates, regions, viewport.center, viewport.zoom])

  if (!activeRegion) {
    return <div className="stormy-empty-state">Start the API to render the regional atlas.</div>
  }

  const delta = activeRegion.baseline_risk_score
    ? Math.round((activeRegion.baseline_risk_score - activeRegion.risk_score) * 10) / 10
    : null
  const activeAnchorPoint = regionAnchorPoints[activeRegion.id] ?? { x: svgViewport.left + svgViewport.width / 2, y: svgViewport.top + svgViewport.height / 2 }
  const activeCardPosition = getExpandedCardPosition(activeRegion, activeAnchorPoint)
  const activeConnectorPoint = getConnectorPoint(activeCardPosition, activeAnchorPoint)

  return (
    <div className={`stormy-atlas${variant === 'expanded' ? ' stormy-atlas--expanded' : ''}`}>
      <div className="stormy-atlas-map">
        <div className="stormy-atlas-map-header">
          <span className={`badge ${liveMapReady ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
            {liveMapReady ? 'Live Azure Maps' : hasLiveMaps ? 'Azure Maps Snapshot' : 'Fallback Atlas'}
          </span>
          <small>
            {liveMapReady
              ? 'Connected to Azure Maps Web SDK'
              : mapError || (hasLiveMaps ? 'Interactive overlay is active on top of the Azure Maps snapshot.' : 'Using embedded SVG while the live map is unavailable.')}
          </small>
        </div>

        <div className="stormy-atlas-map-toolbar">
          <div className="stormy-atlas-segment" role="tablist" aria-label="Atlas metric lens">
            {(['risk', 'people', 'loss'] as AtlasMetric[]).map((metric) => (
              <button
                key={metric}
                type="button"
                className={`stormy-atlas-segment__button${atlasMetric === metric ? ' is-active' : ''}`}
                onClick={() => setAtlasMetric(metric)}>
                {atlasMetricLabels[metric]}
              </button>
            ))}
          </div>

          <div className="stormy-atlas-tool-buttons">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={liveMapReady ? handleResetView : handleFallbackZoomOut}>
              {liveMapReady ? 'Reset View' : 'Zoom Out'}
            </button>
            {!liveMapReady ? (
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleFallbackZoomIn}>
                Zoom In
              </button>
            ) : null}
            {!liveMapReady ? (
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleResetView}>
                Fit Atlas
              </button>
            ) : null}
            {onOpenLargeMap ? (
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onOpenLargeMap}>
                Open Explorer
              </button>
            ) : focusMapUrl ? (
              <a href={focusMapUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary">
                Open Snapshot
              </a>
            ) : null}
          </div>
        </div>

        <div className="stormy-atlas-stage">
          {hasLiveMaps ? <div ref={mapContainerRef} className={`stormy-live-map${liveMapReady ? ' is-ready' : ''}${!liveMapReady ? ' is-hidden' : ''}`} /> : null}

          {!liveMapReady ? (
            <div className="stormy-fallback-frame">
              <div className="stormy-fallback-canvas" style={{ transform: `scale(${fallbackZoom})` }}>
                <svg viewBox="0 0 560 360" role="img" aria-label="Risk atlas" className="stormy-fallback-atlas">
                  <defs>
                    <linearGradient id="stormySea" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0f3f5b" stopOpacity="0.24" />
                      <stop offset="100%" stopColor="#a9d6e5" stopOpacity="0.08" />
                    </linearGradient>
                    <clipPath id="stormyAtlasClip">
                      <rect x="20" y="28" width="520" height="304" rx="24" />
                    </clipPath>
                  </defs>

                  {staticMapUrl ? (
                    <>
                      <image href={staticMapUrl} x="20" y="28" width="520" height="304" preserveAspectRatio="xMidYMid slice" clipPath="url(#stormyAtlasClip)" />
                      <rect x="20" y="28" width="520" height="304" rx="24" fill="rgba(255,255,255,0.08)" />
                    </>
                  ) : (
                    <rect x="20" y="28" width="520" height="304" rx="24" fill="url(#stormySea)" />
                  )}
                  <ellipse cx="270" cy="190" rx="210" ry="104" fill="none" stroke="rgba(255,255,255,0.12)" strokeDasharray="8 8" />
                  <ellipse cx="270" cy="190" rx="164" ry="74" fill="none" stroke="rgba(255,255,255,0.06)" />

                  <g className="stormy-region-anchor">
                    <line
                      x1={activeAnchorPoint.x}
                      y1={activeAnchorPoint.y}
                      x2={activeConnectorPoint.x}
                      y2={activeConnectorPoint.y}
                      stroke="rgba(16, 36, 54, 0.35)"
                      strokeWidth="1.5"
                      strokeDasharray="5 4"
                    />
                    <circle cx={activeAnchorPoint.x} cy={activeAnchorPoint.y} r="8.5" fill="rgba(255,255,255,0.92)" />
                    <circle
                      cx={activeAnchorPoint.x}
                      cy={activeAnchorPoint.y}
                      r="4.8"
                      fill={bandColors[activeRegion.risk_band] || '#84a59d'}
                    />
                  </g>

                  <g className="stormy-region-card">
                    <rect
                      x={activeCardPosition.x}
                      y={activeCardPosition.y}
                      width={activeCardPosition.w}
                      height={activeCardPosition.h}
                      rx="14"
                      fill={bandColors[activeRegion.risk_band] || '#84a59d'}
                      fillOpacity="0.94"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                    <text x={activeCardPosition.x + 10} y={activeCardPosition.y + 22} className="stormy-region-label">
                      {activeRegion.name}
                    </text>
                    <text x={activeCardPosition.x + 10} y={activeCardPosition.y + 40} className="stormy-region-score">
                      {formatAtlasMetricValue(activeRegion, atlasMetric)}
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          ) : null}

          {!liveMapReady ? (
            <div className="stormy-atlas-overlay" aria-label="Interactive parish hotspots">
              {regions.map((region) => {
                const isActive = region.id === activeRegion.id
                const overlayPosition = overlayPositions[region.id] ?? { left: '50%', top: '50%' }
                const markerColor = bandColors[region.risk_band] || '#84a59d'

                return (
                  <button
                    key={region.id}
                    type="button"
                    className={`stormy-atlas-dot${isActive ? ' is-active' : ''}`}
                    style={{ left: overlayPosition.left, top: overlayPosition.top, ['--stormy-dot-color' as any]: markerColor }}
                    onClick={() => onSelect(region.id)}
                    title={`${region.name} ${atlasMetricLabels[atlasMetric]} ${formatAtlasMetricValue(region, atlasMetric)}`}>
                    <span className="stormy-atlas-dot__core" />
                    <span className="stormy-atlas-dot__pulse" />
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>

        <div className="stormy-atlas-caption">
          <span>Tap a parish dot on the atlas or use the hotspot chips to focus the detail panel.</span>
          <span>{liveMapReady ? 'Web SDK controls are active.' : 'Snapshot mode keeps Azure Maps imagery while the SDK reconnects.'}</span>
        </div>

        <div className="stormy-atlas-hotspots">
          {hotspotRegions.map((region) => (
            <button
              key={region.id}
              type="button"
              className={`stormy-atlas-hotspot${region.id === activeRegion.id ? ' is-active' : ''}`}
              onClick={() => onSelect(region.id)}>
              <span>{region.name}</span>
              <strong>{formatAtlasMetricValue(region, atlasMetric)}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="stormy-atlas-detail">
        <div className="stormy-atlas-detail-header">
          <span className={`stormy-band stormy-band-${activeRegion.risk_band.toLowerCase()}`}>{activeRegion.risk_band}</span>
          <small>{mode === 'scenario' ? 'Scenario output' : 'Baseline risk posture'}</small>
        </div>
        <h3>{activeRegion.name}</h3>
        <div className="stormy-atlas-metrics">
          <div>
            <span>Risk score</span>
            <strong>{activeRegion.risk_score}</strong>
          </div>
          <div>
            <span>People at risk</span>
            <strong>{activeRegion.people_at_risk.toLocaleString()}</strong>
          </div>
          <div>
            <span>Facilities at risk</span>
            <strong>{activeRegion.critical_facilities_at_risk}</strong>
          </div>
          <div>
            <span>Annual loss</span>
            <strong>${activeRegion.expected_loss_musd.toFixed(1)}M</strong>
          </div>
        </div>

        {delta !== null ? (
          <div className="stormy-delta-chip">
            {delta >= 0 ? `${delta} points lower than baseline` : `${Math.abs(delta)} points higher than baseline`}
          </div>
        ) : null}

        <div className="stormy-driver-list">
          <span>Primary drivers</span>
          <ul>
            {activeRegion.drivers.map((driver) => (
              <li key={driver}>{driver}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default RiskAtlas
