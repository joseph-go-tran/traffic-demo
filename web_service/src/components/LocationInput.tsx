import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';
import { useDebouncedSearch } from '../hooks/useDebouncedSearch';
import { apiService } from '../lib/api';
import { PlaceResult } from '../hooks/useRouting';

interface LocationInputProps {
  label: string;
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder: string;
  icon: React.ReactNode;
  className?: string;
}

export default function LocationInput({
  label,
  value,
  onChange,
  placeholder,
  icon,
  className = ''
}: LocationInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Stable search function using useCallback
  const searchPlaces = useCallback(async (query: string): Promise<PlaceResult[]> => {
    try {
      const response = await apiService.routes.searchPlaces({
        query,
        radius: 50000 // 50km radius
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }, []); // Empty dependency array makes this stable

  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearResults
  } = useDebouncedSearch({
    searchFunction: searchPlaces,
    delay: 300,
    minLength: 2
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    setIsOpen(true);
    setSelectedPlace(null);
  };

  // Handle place selection
  const handlePlaceSelect = (place: PlaceResult) => {
    setSelectedPlace(place);
    setQuery(place.name);
    onChange(place.name, place.coordinates);
    setIsOpen(false);
    clearResults();
  };

  // Handle clear
  const handleClear = () => {
    setQuery('');
    onChange('');
    setSelectedPlace(null);
    setIsOpen(false);
    clearResults();
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync external value changes with a ref to prevent infinite loops
  const valueRef = useRef(value);
  const queryRef = useRef(query);

  useEffect(() => {
    // Only update if the external value actually changed and is different from current query
    if (value !== valueRef.current && value !== queryRef.current) {
      valueRef.current = value;
      setQuery(value);
    }
  }, [value]);

  // Keep refs in sync
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          {icon}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          autoComplete="off"
        />
        {(query || isLoading) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <button
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {error && (
            <div className="px-4 py-2 text-sm text-red-600 border-b border-gray-100">
              Error: {error}
            </div>
          )}

          {results.length > 0 ? (
            results.map((place, index) => (
              <button
                key={`${place.coordinates.lat}-${place.coordinates.lng}-${index}`}
                onClick={() => handlePlaceSelect(place)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
              >
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {place.name}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {place.address}
                    </div>
                    {place.category && (
                      <div className="text-xs text-purple-600 mt-1">
                        {place.category}
                      </div>
                    )}
                  </div>
                  {place.distance && (
                    <div className="text-xs text-gray-400 flex-shrink-0">
                      {(place.distance / 1000).toFixed(1)}km
                    </div>
                  )}
                </div>
              </button>
            ))
          ) : query.length >= 2 && !isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
