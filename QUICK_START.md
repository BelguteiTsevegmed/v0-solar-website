# Quick Start - Roof Selection with Google Maps

## ✅ What's Been Implemented

### 1. **Address Autocomplete on Homepage** 🏠

Your hero section now features **Google Places Autocomplete**:

- Real-time address suggestions as users type
- Beautiful themed dropdown matching your design
- Improved accuracy and user experience
- Country restrictions to areas with Solar API coverage

### 2. **Draggable Marker on Roof Selection** 📍

Your roof selection page has a **draggable marker system**:

- Shows user's address on a satellite map
- Lets them drag an orange marker to confirm their exact house location
- Automatically fetches Solar API data as they move the marker
- Passes precise lat/lng coordinates to the next step

## 🚀 Optimal Google APIs Setup

### Required APIs (Enable in Google Cloud Console)

1. **Maps JavaScript API** ✅ - Display satellite maps
2. **Geocoding API** ✅ - Convert address to coordinates
3. **Solar API** ✅ - Get building insights and solar potential
4. **Places API** ✅ - Address autocomplete (NOW IMPLEMENTED!)

### Quick Setup

1. **Enable APIs:**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** → **Library**
   - Search and enable all 4 APIs above

2. **Create API Key:**

   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **API key**
   - Copy the key

3. **Add to your project:**

   ```bash
   # In .env.local
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

4. **Secure your API key:**
   - In Google Cloud Console, click on your API key
   - Add HTTP referrer restrictions:
     - `http://localhost:3000/*` (development)
     - `https://yourdomain.com/*` (production)
   - Add API restrictions: Select only the 4 APIs you need

## 🎯 How It Works

### User Flow:

```
1. User enters address on homepage
   ↓
2. Geocoding API converts to lat/lng
   ↓
3. Map loads with draggable marker at that location
   ↓
4. Solar API shows building outline + solar stats
   ↓
5. User drags marker to exact house location
   ↓
6. Solar API auto-updates with new data
   ↓
7. User clicks "Continue"
   ↓
8. Confirmed lat/lng passed to roof-render page
```

### Why This Approach is Optimal:

✅ **Geocoding API** gets initial location from address text  
✅ **Draggable marker** lets users correct/fine-tune the location  
✅ **Solar API** gets accurate building data for the confirmed coordinates  
✅ **No manual lat/lng entry** - better UX  
✅ **Visual confirmation** - users see exactly what building they selected

## 📝 Testing Checklist

### Homepage (Places Autocomplete):

1. ✅ API key set in `.env.local`
2. ✅ All 4 APIs enabled in Google Cloud Console
3. ✅ Dev server running (`pnpm dev`)
4. ✅ Start typing an address in the hero input field
5. ✅ See autocomplete dropdown with suggestions
6. ✅ Click a suggestion - address auto-fills
7. ✅ Submit the form

### Roof Selection (Map & Marker):

8. ✅ Map loads in satellite view
9. ✅ Orange marker appears at the address
10. ✅ Drag marker to different location
11. ✅ See polygon/stats update automatically
12. ✅ Click "Continue" - coordinates passed to next page

## 🔍 What Gets Passed to Solar API

The confirmed coordinates (lat/lng) are used to call:

```
https://solar.googleapis.com/v1/buildingInsights:findClosest
  ?location.latitude={lat}
  &location.longitude={lng}
  &requiredQuality=HIGH
  &key={apiKey}
```

This returns:

- Building boundary box (for polygon)
- Max solar panels capacity
- Roof area in m²
- Annual sunshine hours
- CO₂ offset potential

## 📚 Documentation

- **Full setup guide:** `GOOGLE_APIS_SETUP.md`
- **Implementation details:** `ROOF_SELECTION_IMPLEMENTATION.md`

## ⚠️ Important Notes

### Solar API Coverage

The Solar API doesn't have global coverage. Best results in:

- United States (full coverage)
- Germany, France (partial coverage)
- Limited data in Poland

If testing with Polish addresses and not seeing building data - that's expected. The map and marker will still work perfectly.

### For Production

- Set up billing alerts in Google Cloud
- Monitor API usage in Google Cloud Console
- Consider implementing address autocomplete (Places API)
- Add caching to reduce redundant Solar API calls

## 💡 Next Steps

1. ✅ **Places Autocomplete** - DONE! Already implemented on homepage
2. **Test the full flow** - Enter addresses, use autocomplete, drag marker
3. **Implement roof-render page** - Use the lat/lng for 3D visualization
4. **Monitor costs** - Set up Google Cloud billing alerts
5. **(Optional) Add location detection** - "Use My Location" button

## 🆘 Troubleshooting

**Map doesn't load?**

- Check `.env.local` has `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Verify Maps JavaScript API is enabled
- Check browser console for errors

**No building polygon?**

- Solar API may not have data for your test location
- Try a US address (e.g., "1600 Amphitheatre Parkway, Mountain View, CA")
- Check console for `[v0] Solar API error:`

**Marker doesn't move?**

- It should be draggable by default
- Try clicking and holding, then dragging
- Check console for JavaScript errors

**Autocomplete not working?**

- Ensure Places API is enabled in Google Cloud Console
- Check that Places API is allowed in your API key restrictions
- Try typing at least 3 characters
- Check browser console for API errors
- Verify API key has correct HTTP referrer restrictions

---

**Need more details?**

- Places Autocomplete: See `PLACES_API_SETUP.md`
- Google APIs Overview: See `GOOGLE_APIS_SETUP.md`
- Roof Selection: See `ROOF_SELECTION_IMPLEMENTATION.md`
