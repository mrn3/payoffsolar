"use client";

import React, { useEffect, useRef } from "react";

interface GooglePlaceAddressComponent {
	long_name: string;
	short_name: string;
	types: string[];
}

interface GooglePlaceResult {
	address_components?: GooglePlaceAddressComponent[];
	formatted_address?: string;
}

interface GoogleAutocomplete {
	getPlace(): GooglePlaceResult;
	setFields?(fields: string[]): void;
	addListener(eventName: string, handler: () => void): void;
	unbindAll?(): void;
}

interface GoogleMapsPlacesNamespace {
		Autocomplete: new (
			input: HTMLInputElement,
			options: { types?: string[]; componentRestrictions?: { country?: string | string[] } },
		) => GoogleAutocomplete;
	}

interface GoogleMapsNamespace {
	places?: GoogleMapsPlacesNamespace;
}

interface GoogleNamespace {
	maps?: GoogleMapsNamespace;
}

declare global {
	interface Window {
		google?: GoogleNamespace;
	}
}

interface AddressParts {
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface GooglePlacesAddressInputProps {
  onAddressSelect: (parts: AddressParts) => void;
  className?: string;
}

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

export default function GooglePlacesAddressInput({
  onAddressSelect,
  className = "",
}: GooglePlacesAddressInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const onAddressSelectRef = useRef(onAddressSelect);

  useEffect(() => {
    onAddressSelectRef.current = onAddressSelect;
  }, [onAddressSelect]);

	  useEffect(() => {
	    if (!GOOGLE_PLACES_API_KEY) {
	      console.warn(
	        "Missing NEXT_PUBLIC_GOOGLE_PLACES_API_KEY for Google Places Autocomplete",
	      );
	      return;
	    }

	    let autocomplete: GoogleAutocomplete | undefined;

    const initAutocomplete = () => {
	    	  const maps = window.google?.maps;
	    	  const places = maps?.places;
	    	  if (!inputRef.current || !places) {
	    	    return;
	    	  }
	    	
	    	autocomplete = new places.Autocomplete(inputRef.current, {
	    	    // Allow broader location types (cities, states, etc.),
	    	    // not just full street addresses.
	    	    componentRestrictions: { country: "us" },
	    	  });
	    	
	      autocomplete?.setFields?.(["address_components", "formatted_address"]);

      autocomplete.addListener("place_changed", () => {
	        const place = autocomplete?.getPlace();
        if (!place || !place.address_components) return;

        let streetNumber = "";
        let route = "";
        let city = "";
        let state = "";
        let zip = "";

        for (const component of place.address_components) {
          const types = component.types || [];
          if (types.includes("street_number")) {
            streetNumber = component.long_name;
          } else if (types.includes("route")) {
            route = component.long_name;
          } else if (types.includes("locality")) {
            city = component.long_name;
          } else if (types.includes("administrative_area_level_1")) {
            state = component.short_name;
          } else if (types.includes("postal_code")) {
            zip = component.long_name;
          }
        }

        const address = [streetNumber, route].filter(Boolean).join(" ");

        if (inputRef.current && place.formatted_address) {
          inputRef.current.value = place.formatted_address;
        }

        onAddressSelectRef.current({
          address,
          city,
          state,
          zip,
        });
      });
    };

    const existingScript = document.querySelector(
      "script[data-google-places=\"true\"]",
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if (
        window.google &&
        window.google.maps &&
        window.google.maps.places
      ) {
        initAutocomplete();
      } else {
        existingScript.addEventListener("load", initAutocomplete);
      }
    } else {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.dataset.googlePlaces = "true";
      script.addEventListener("load", initAutocomplete);
      document.head.appendChild(script);
    }

    return () => {
      if (autocomplete && autocomplete.unbindAll) {
        autocomplete.unbindAll();
      }
    };
  }, []);

	  return (
	    <input
	      type="text"
	      ref={inputRef}
	      placeholder="Start typing an address, city, or state..."
	      className={className}
	    />
	  );
}

