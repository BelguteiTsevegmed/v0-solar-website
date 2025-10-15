# Google APIs Setup Guide

## Required Google Cloud APIs

Your solar panel roof selection application requires the following Google Cloud APIs to be enabled:

### 1. **Maps JavaScript API** ✅
- **Purpose**: Display interactive satellite maps
- **Used in**: Roof selection page
- **What it does**: Renders the satellite view map where users can see their property
- **Cost**: $7.00 per 1,000 map loads (after free tier)

### 2. **Geocoding API** ✅
- **Purpose**: Convert address text to latitude/longitude coordinates
- **Used in**: Converting user-entered address to map coordinates
- **What it does**: Transforms "ul. Przykładowa 123, Warszawa" → `{lat: 52.2297, lng: 21.0122}`
- **Cost**: $5.00 per 1,000 requests (after free tier)

### 3. **Solar API** ✅
- **Purpose**: Get building insights and solar potential data
- **Used in**: Roof selection page
- **What it does**: Returns:
  - Building boundaries
  - Maximum panel count
  - Roof area in m²
  - Annual sunshine hours
  - Carbon offset potential
- **Cost**: Free for up to 750 requests/day, then $0.01 per request

### 4. **Places API (Autocomplete)** ⭐ RECOMMENDED
- **Purpose**: Address autocomplete suggestions
- **Should be used in**: Hero section address input
- **What it does**: Provides address suggestions as users type
- **Cost**: $2.83 per 1,000 requests (after free tier)
- **Why needed**: Improves accuracy and user experience

## How the Flow Works

```
User enters address on homepage
         ↓
   Geocoding API converts to lat/lng
         ↓
   Map loads at that location (Maps JavaScript API)
         ↓
   User drags marker to confirm exact location
         ↓
   Solar API fetches building data for lat/lng
         ↓
   User sees building outline + solar potential
         ↓
   User confirms and proceeds to next step
```

## Google Cloud Console Setup

### Step 1: Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Library**
4. Search for and enable each API:
   - ✅ Maps JavaScript API
   - ✅ Geocoding API
   - ✅ Solar API
   - ⭐ Places API (recommended)

### Step 2: Create API Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API key**
3. Copy the API key
4. **IMPORTANT**: Restrict your API key:
   - Click on the newly created key
   - Under "Application restrictions":
     - For development: Choose "HTTP referrers" and add `http://localhost:3000/*`
     - For production: Add your domain `https://yourdomain.com/*`
   - Under "API restrictions":
     - Choose "Restrict key"
     - Select: Maps JavaScript API, Geocoding API, Solar API, Places API

### Step 3: Set Environment Variable

Add to your `.env.local` file:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

⚠️ **Security Note**: This key is prefixed with `NEXT_PUBLIC_` because it needs to be accessible in the browser for the Maps JavaScript API. Make sure you have proper API key restrictions in place!

## Current Implementation

### Roof Selection Page
The roof selection page now features:

1. **Draggable Marker** 🎯
   - Orange circular marker at the geocoded address
   - Users can drag it to their exact building location
   - Automatically fetches new Solar API data when moved

2. **Editable Polygon** 📐
   - Shows building outline from Solar API
   - Users can adjust vertices to match their roof precisely
   - Orange color with transparency

3. **Real-time Solar Insights** ☀️
   - Max panel count
   - Roof area (m²)
   - Annual sunshine hours
   - CO₂ reduction potential

### Data Flow to Next Page

When user clicks "Continue", the following data is passed:
- Address (original text)
- Confirmed latitude (`lat`)
- Confirmed longitude (`lng`)

URL format: `/roof-render?address=...&lat=52.2297&lng=21.0122`

## Testing Your Setup

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Navigate to homepage
3. Enter an address and click search
4. You should see:
   - ✅ Map loads at the address location
   - ✅ Draggable orange marker appears
   - ✅ Building outline polygon appears (if Solar API finds data)
   - ✅ Solar potential stats display (if available)

5. Test marker dragging:
   - Drag the marker to a new location
   - Watch the polygon and stats update

## Troubleshooting

### Map doesn't load
- Check if `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env.local`
- Verify Maps JavaScript API is enabled in Google Cloud Console
- Check browser console for API key errors

### Address doesn't geocode
- Verify Geocoding API is enabled
- Check if the address format is valid
- Look for error logs in server console

### No building data appears
- Verify Solar API is enabled
- Check if the location has Solar API coverage (mainly US and some European countries)
- Look for Solar API errors in browser console
- The Solar API may return no data for some locations

### "This page can't load Google Maps correctly" error
- Your API key may not have proper restrictions
- Ensure your domain/localhost is whitelisted in API key settings
- Check that all required APIs are enabled

## Cost Optimization Tips

1. **Use Places Autocomplete**: Reduces incorrect addresses and wasted Geocoding API calls
2. **Cache results**: Don't re-fetch Solar API data if location hasn't changed
3. **Set up billing alerts**: Get notified before costs exceed your budget
4. **Use session tokens**: For Places API to reduce costs (for autocomplete implementation)

## Next Steps (Optional Improvements)

1. **Implement Places Autocomplete** on hero section for better UX
2. **Add address validation** before geocoding
3. **Cache Solar API responses** to avoid redundant calls
4. **Add loading states** during marker drag (debounce API calls)
5. **Store confirmed lat/lng** in database for returning users

