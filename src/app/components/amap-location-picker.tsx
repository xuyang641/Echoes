import { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { Loader2, Search, X, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AmapLocationPickerProps {
  initialLocation?: { lat: number; lng: number; name?: string };
  onConfirm: (location: { lat: number; lng: number; name: string; address?: string }) => void;
  onCancel: () => void;
}

export function AmapLocationPicker({ initialLocation, onConfirm, onCancel }: AmapLocationPickerProps) {
  const { t } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; name: string; address?: string } | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Refs to hold AMap instances
  const mapRef = useRef<any>(null);
  const placeSearchRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const AMapRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      try {
        // Set security code if provided
        if (import.meta.env.VITE_AMAP_SECURITY_CODE) {
          (window as any)._AMapSecurityConfig = {
            securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE,
          };
        }

        const AMap = await AMapLoader.load({
          key: import.meta.env.VITE_AMAP_KEY || '', // Devs need to set this
          version: '2.0',
          plugins: ['AMap.PlaceSearch', 'AMap.AutoComplete', 'AMap.Geocoder', 'AMap.Geolocation'],
        });

        if (!mounted) return;
        AMapRef.current = AMap;

        const center = initialLocation 
          ? [initialLocation.lng, initialLocation.lat] 
          : [116.397428, 39.90923]; // Default to Beijing

        const map = new AMap.Map(mapContainerRef.current, {
          zoom: 15,
          center: center,
          viewMode: '2D',
        });
        mapRef.current = map;

        // Initialize Geocoder
        const geocoder = new AMap.Geocoder({
          city: '010', // Default city code
          radius: 1000, // Range
          extensions: 'all' // Critical: Required to get POIs and AOIs (Communities)
        });
        geocoderRef.current = geocoder;

        // Initialize PlaceSearch
        const placeSearch = new AMap.PlaceSearch({
          pageSize: 10,
          pageIndex: 1,
          map: map, // Show results on map? Maybe not, custom handling is better
          extensions: 'all'
        });
        placeSearchRef.current = placeSearch;

        // Add Marker
        const marker = new AMap.Marker({
          position: center,
          draggable: true,
          cursor: 'move',
        });
        marker.setMap(map);
        markerRef.current = marker;

        // Handle Map Click
        map.on('click', (e: any) => {
          const lng = e.lnglat.getLng();
          const lat = e.lnglat.getLat();
          updateMarkerPosition([lng, lat]);
          reverseGeocode([lng, lat]);
        });

        // Handle Marker Drag
        marker.on('dragend', (e: any) => {
          const lng = e.lnglat.getLng();
          const lat = e.lnglat.getLat();
          reverseGeocode([lng, lat]);
        });

        // If initial location provided, try to get address
        if (initialLocation) {
          reverseGeocode([initialLocation.lng, initialLocation.lat]);
        } else {
           // Try to get current location
           const geolocation = new AMap.Geolocation({
             enableHighAccuracy: true,
             timeout: 10000,
             buttonPosition: 'RB',
             buttonOffset: new AMap.Pixel(10, 20),
             zoomToAccuracy: true,
           });
           map.addControl(geolocation);
           geolocation.getCurrentPosition((status: string, result: any) => {
             if (status === 'complete') {
                // Use reverseGeocode to get the POI/AOI name instead of just formattedAddress
                updateMarkerPosition([result.position.lng, result.position.lat]);
                reverseGeocode([result.position.lng, result.position.lat]);
             }
           });
        }

        setLoading(false);
      } catch (e: any) {
        console.error('Failed to load AMap:', e);
        setError('Failed to load map. Please check your API Key configuration.');
        setLoading(false);
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.destroy();
      }
    };
  }, []);

  const updateMarkerPosition = (position: [number, number]) => {
    if (markerRef.current) {
      markerRef.current.setPosition(position);
    }
    if (mapRef.current) {
      mapRef.current.setCenter(position);
    }
  };

  const reverseGeocode = (lnglat: [number, number]) => {
    if (!geocoderRef.current) return;
    
    geocoderRef.current.getAddress(lnglat, (status: string, result: any) => {
      if (status === 'complete' && result.regeocode) {
        // Try to find the best POI around
        const pois = result.regeocode.pois;
        const address = result.regeocode.formattedAddress;
        let name = address;
        
        if (pois && pois.length > 0) {
          // Prefer the closest POI
          name = pois[0].name;
        } 
        
        // If there are AOIs (Areas of Interest, like communities/estates), they are often better for "Where am I?"
        if (result.regeocode.aois && result.regeocode.aois.length > 0) {
           name = result.regeocode.aois[0].name; // Area of Interest (e.g. Community)
        }

        setSelectedLocation({
          lat: lnglat[1],
          lng: lnglat[0],
          name: name,
          address: address
        });
      }
    });
  };

  const handleSearch = () => {
    if (!searchKeyword.trim() || !placeSearchRef.current) return;
    setIsSearching(true);
    
    placeSearchRef.current.search(searchKeyword, (status: string, result: any) => {
      setIsSearching(false);
      if (status === 'complete' && result.poiList) {
        setSearchResults(result.poiList.pois);
      } else {
        setSearchResults([]);
      }
    });
  };

  const selectSearchResult = (poi: any) => {
    const lng = poi.location.lng;
    const lat = poi.location.lat;
    updateMarkerPosition([lng, lat]);
    setSelectedLocation({
      lat,
      lng,
      name: poi.name,
      address: poi.address
    });
    setSearchResults([]);
    setSearchKeyword('');
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="text-red-500 mb-2">{t('common.error')}</div>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button onClick={onCancel} className="text-blue-500 hover:underline">{t('common.cancel')}</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden relative">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-2 bg-white z-10">
        <div className="flex-1 relative">
           <input 
             type="text" 
             value={searchKeyword}
             onChange={(e) => setSearchKeyword(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
             placeholder={t('form.locationPlaceholder')}
             className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
           />
           {isSearching ? (
             <Loader2 className="w-4 h-4 text-blue-500 animate-spin absolute left-3 top-1/2 -translate-y-1/2" />
           ) : (
             <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
           )}
           {searchResults.length > 0 && (
             <div className="absolute top-full left-0 right-0 mt-2 bg-white shadow-xl rounded-lg max-h-60 overflow-y-auto z-50 border border-gray-100">
               {searchResults.map((poi) => (
                 <div 
                   key={poi.id}
                   onClick={() => selectSearchResult(poi)}
                   className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none"
                 >
                   <div className="font-medium text-sm text-gray-800">{poi.name}</div>
                   <div className="text-xs text-gray-500 truncate">{poi.address}</div>
                 </div>
               ))}
             </div>
           )}
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-500">{t('common.loading')}</span>
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Selected Location Card */}
        {selectedLocation && (
           <div className="absolute bottom-6 left-4 right-4 bg-white p-4 rounded-xl shadow-lg z-10 animate-in slide-in-from-bottom-4">
             <div className="flex items-start gap-3 mb-3">
               <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                 <MapPin className="w-4 h-4 text-blue-600" />
               </div>
               <div>
                 <h4 className="font-bold text-gray-900">{selectedLocation.name}</h4>
                 <p className="text-xs text-gray-500 mt-1 line-clamp-2">{selectedLocation.address}</p>
               </div>
             </div>
             <button 
               onClick={() => onConfirm(selectedLocation)}
               className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
             >
               {t('common.save')}
             </button>
           </div>
        )}
      </div>
    </div>
  );
}
