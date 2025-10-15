# Roof Selection Implementation Summary

## What Was Fixed

### Problem

The Google Maps API in the roof selection page wasn't working properly for getting accurate geocode coordinates needed for the Solar API.

### Solution Implemented

Added a **draggable marker** system that allows users to:

1. See their address geocoded on a satellite map
2. **Drag an orange marker** to confirm/adjust their exact house location
3. View real-time Solar API data that updates as they move the marker
4. See and edit the building polygon outline
5. Pass the confirmed coordinates to the next step

## Google APIs Used

### Required APIs (Must be enabled in Google Cloud Console)

1. **Maps JavaScript API**
   - Displays the satellite view map
   - Renders markers and polygons
2. **Geocoding API**

   - Converts address text → lat/lng coordinates
   - Used in: `app/actions/solar-api.ts` → `geocodeAddress()`

3. **Solar API**

   - Fetches building insights and solar potential
   - Returns: building boundaries, panel capacity, sunshine hours, CO₂ offset
   - Used in: `app/actions/solar-api.ts` → `fetchBuildingInsights()`

4. **Places API** (Recommended)
   - For address autocomplete on the homepage
   - Improves address accuracy and UX

## User Flow

```
Homepage (Hero Section)
  ↓ User enters address
  ↓ Geocoding API converts to coordinates
  ↓
Roof Selection Page
  ↓ Map loads at geocoded location
  ↓ Draggable orange marker appears
  ↓ Solar API fetches building data
  ↓ Building polygon outline appears
  ↓
  ↓ User drags marker to exact location
  ↓ Solar API auto-updates with new data
  ↓ User can edit polygon vertices
  ↓
  ↓ User clicks "Continue"
  ↓ Coordinates passed to next page
  ↓
Roof Render Page
  ✓ Receives: address, lat, lng
  ✓ Ready for 3D visualization
```

## Key Features Implemented

### 1. Draggable Location Marker 🎯

- **Visual**: Orange circular marker with white border
- **Behavior**:
  - Initially placed at geocoded address
  - User can drag to adjust location
  - On drag end, automatically fetches new Solar API data

```typescript
// Created marker with custom styling
const marker = new window.google.maps.Marker({
  position: location,
  map: mapInstance,
  draggable: true,
  title: "Przeciągnij mnie do swojego domu",
  icon: {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: "#ff6b35",
    fillOpacity: 0.9,
    strokeColor: "#ffffff",
    strokeWeight: 3,
  },
});

// Auto-update on drag
marker.addListener("dragend", async () => {
  const newPos = marker.getPosition();
  // Fetch new building insights...
});
```

### 2. Building Polygon Overlay 📐

- **Visual**: Editable orange polygon
- **Data Source**: Solar API `boundingBox`
- **Behavior**:
  - Shows building outline
  - User can click vertices to adjust shape
  - Updates when marker is dragged

### 3. Real-time Solar Insights ☀️

Displays when Solar API returns data:

- Max panel count
- Roof area (m²)
- Annual sunshine hours
- CO₂ reduction potential (kg/MWh)

### 4. Coordinate Passing

On "Continue", passes to next page:

```
/roof-render?address=...&lat=52.229676&lng=21.012229
```

## Files Modified

### 1. `app/roof-selection/page.tsx`

**Changes:**

- ✅ Added draggable marker functionality
- ✅ Added `currentLocation` state to track confirmed position
- ✅ Added marker drag listener to update Solar API data
- ✅ Pass lat/lng to roof-render page
- ✅ Updated UI instructions
- ✅ Added TypeScript declarations for Google Maps

**Key State:**

```typescript
const [currentLocation, setCurrentLocation] = useState<{
  lat: number;
  lng: number;
} | null>(null);
const markerRef = useRef<any | null>(null);
```

### 2. `components/google-maps-loader.tsx`

**Changes:**

- ✅ Added `places` library for future autocomplete
- ✅ Added `marker` library for advanced marker features
- ✅ Kept `drawing` library for future use

**Before:**

```typescript
src={`...&libraries=drawing`}
```

**After:**

```typescript
src={`...&libraries=places,drawing,marker`}
```

### 3. `app/roof-render/page.tsx`

**Changes:**

- ✅ Now receives and displays `lat` and `lng` parameters
- ✅ Shows coordinates for debugging/implementation
- ✅ Ready for 3D Solar API integration

## How to Test

### Prerequisites

1. Ensure `.env.local` has your API key:

   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
   ```

2. Enable these APIs in Google Cloud Console:
   - Maps JavaScript API
   - Geocoding API
   - Solar API
   - (Optional) Places API

### Testing Steps

1. **Start the dev server:**

   ```bash
   pnpm dev
   ```

2. **Test on homepage:**

   - Enter a valid address (e.g., "Plac Defilad 1, Warszawa, Poland")
   - Click search/submit

3. **On roof selection page, verify:**

   - ✅ Map loads in satellite view
   - ✅ Orange marker appears at the address
   - ✅ Building outline polygon appears (if Solar API has data)
   - ✅ Solar potential stats display (if available)

4. **Test marker dragging:**

   - Drag the orange marker to a different location
   - Watch the console for Solar API calls
   - Verify polygon and stats update

5. **Test polygon editing:**

   - Click and drag polygon vertices
   - Verify shape updates

6. **Test continuation:**
   - Click "Kontynuuj" button
   - Verify you're redirected to `/roof-render`
   - Verify URL contains `?address=...&lat=...&lng=...`
   - Verify coordinates display on the render page

## Console Logs (for debugging)

The implementation logs useful debug info:

- `[v0] Solar API error:` - Solar API failures
- `[v0] Selected roof coordinates:` - Polygon vertices on continue
- `[v0] Confirmed location:` - Final lat/lng on continue
- `[v0] Building insights:` - Solar API response data

## Solar API Coverage

⚠️ **Important**: The Solar API doesn't have global coverage. It works best in:

- United States (full coverage)
- Germany
- France
- Some other European countries

If you're testing with Polish addresses and getting no building data, this is expected. The marker and map will still work - just without Solar API insights.

## Next Steps / Future Enhancements

### Recommended Improvements

1. **Address Autocomplete** (High Priority)

   - Implement Google Places Autocomplete on hero section
   - Improves address accuracy
   - Better UX

2. **Loading States**

   - Add loading indicator during marker drag
   - Debounce Solar API calls (wait 500ms after drag stops)

3. **Error Handling**

   - Better UI for "No Solar data available" case
   - Fallback for areas without Solar API coverage

4. **Data Persistence**

   - Store confirmed coordinates in localStorage
   - Or in a database for logged-in users

5. **3D Visualization**
   - Integrate Solar API's `solarPanels` data on roof-render page
   - Show 3D roof model with panel placement

## API Cost Estimate

For 1,000 users going through the flow:

| API             | Usage per User | Cost per 1K          | Total Cost    |
| --------------- | -------------- | -------------------- | ------------- |
| Geocoding       | 1 request      | $5.00                | $5.00         |
| Maps JavaScript | 1 load         | $7.00                | $7.00         |
| Solar API       | 1-3 requests\* | Free (up to 750/day) | $0.00 - $0.03 |

\*1 initial + 1-2 if user drags marker

**Total estimated cost**: ~$12-15 per 1,000 users (after free tiers)

## Security Best Practices

✅ **Implemented:**

- API key is browser-accessible (required for Maps JavaScript API)
- Using `NEXT_PUBLIC_` prefix (Next.js client-side env var)

⚠️ **You MUST:**

1. Add API key restrictions in Google Cloud Console:
   - HTTP referrer restrictions (your domain)
   - API restrictions (only the 4 APIs needed)
2. Set up billing alerts to avoid surprises

3. Never commit `.env.local` to git (already in `.gitignore`)

## Troubleshooting

### Map doesn't load

- Check browser console for errors
- Verify API key in `.env.local`
- Confirm Maps JavaScript API is enabled
- Check API key restrictions aren't blocking localhost

### Marker doesn't appear

- Check if geocoding succeeded (console logs)
- Verify address was entered
- Try a well-known address (e.g., "Times Square, New York")

### No building polygon

- Solar API may not have data for this location
- Check console for `[v0] Solar API error:`
- Try a US address for guaranteed coverage

### TypeScript errors

- The `declare global { interface Window }` should fix them
- If not, try restarting TypeScript server in your IDE

## Support

For Google Cloud/API issues:

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Solar API Documentation](https://developers.google.com/maps/documentation/solar)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
