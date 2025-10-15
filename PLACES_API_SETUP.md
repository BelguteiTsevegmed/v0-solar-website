# Google Places API - Address Autocomplete Implementation

## ✅ What's Been Implemented

Your homepage now features **Google Places Autocomplete** on the address input field, providing:

- Real-time address suggestions as users type
- Country restrictions to areas with Solar API coverage
- Beautiful, themed autocomplete dropdown
- Improved address accuracy and user experience

## 🎯 How It Works

### User Experience Flow

```
User starts typing address
         ↓
   Places API suggests matching addresses
         ↓
   Dropdown appears with suggestions
         ↓
   User clicks/selects suggestion
         ↓
   Address field auto-fills with formatted address
         ↓
   User submits → proceeds to roof selection
```

### Technical Implementation

**File: `components/hero-section.tsx`**

1. **Initialization on component mount:**

   ```typescript
   useEffect(() => {
     const autocomplete = new window.google.maps.places.Autocomplete(
       inputRef.current,
       {
         types: ["address"],
         componentRestrictions: { country: ["pl", "de", "fr", "us"] },
         fields: ["formatted_address", "geometry", "address_components"],
       }
     );
   }, []);
   ```

2. **Listen for selection:**
   ```typescript
   autocomplete.addListener("place_changed", () => {
     const place = autocomplete.getPlace();
     if (place.formatted_address) {
       setAddress(place.formatted_address);
     }
   });
   ```

## 🎨 Custom Styling

The autocomplete dropdown is fully styled to match your theme using custom CSS in `app/globals.css`:

### Features:

- ✅ Matches background/foreground colors
- ✅ Uses your brand's orange color for highlights
- ✅ Supports dark mode automatically
- ✅ Custom pin emoji icon (📍)
- ✅ Smooth hover effects

### CSS Classes:

- `.pac-container` - Main dropdown container
- `.pac-item` - Each suggestion item
- `.pac-matched` - Matched text (highlighted in orange)
- `.pac-item-query` - Main address text

## 🌍 Country Restrictions

Currently restricted to countries with good Solar API coverage:

```typescript
componentRestrictions: {
  country: ["pl", "de", "fr", "us"];
}
```

**Coverage:**

- 🇺🇸 **United States** - Full Solar API coverage
- 🇩🇪 **Germany** - Good Solar API coverage
- 🇫🇷 **France** - Good Solar API coverage
- 🇵🇱 **Poland** - Limited Solar API coverage

### To Add More Countries:

```typescript
componentRestrictions: {
  country: ["pl", "de", "fr", "us", "es", "it"];
}
```

Check [Solar API coverage](https://developers.google.com/maps/documentation/solar/coverage) before adding.

## 📋 Configuration Options

### Current Setup:

```typescript
{
  types: ["address"],                                    // Only address suggestions
  componentRestrictions: { country: ["pl", "de", "fr", "us"] }, // Restricted countries
  fields: ["formatted_address", "geometry", "address_components"] // Data to return
}
```

### Available Options:

**Types:**

- `["address"]` - Street addresses only (recommended)
- `["geocode"]` - All geocodable locations
- `["(regions)"]` - Cities, states, countries
- `["establishment"]` - Businesses and points of interest

**Fields (what data to retrieve):**

- `formatted_address` - Human-readable address
- `geometry` - Lat/lng coordinates
- `address_components` - Parsed address parts
- `name` - Place name
- `place_id` - Unique Google ID

💡 **Tip:** Only request fields you need to reduce API costs!

## 💰 Cost Optimization

### How Autocomplete Billing Works:

1. **Autocomplete - Per Session:**
   - Session = User starts typing → selects suggestion
   - Cost: **$2.83 per session** (Pay per Selection)
2. **Session Tokens (Best Practice):**
   - Group requests into sessions
   - Only pay when user selects
   - Not charged for typing without selection

### Current Implementation Cost:

- ✅ Using session-based pricing automatically
- ✅ Only specific fields requested
- ✅ No redundant API calls

### For 1,000 Users:

- Autocomplete sessions: ~$2.83 per 1,000 selections
- Much cheaper than wrong addresses → re-geocoding!

## 🚀 Setup Checklist

### 1. Enable Places API

In [Google Cloud Console](https://console.cloud.google.com/):

1. Navigate to **APIs & Services** → **Library**
2. Search for "Places API"
3. Click **Enable**

### 2. Update API Key Restrictions

1. Go to **APIs & Services** → **Credentials**
2. Click your API key
3. Under "API restrictions":
   - Select "Restrict key"
   - Ensure **Places API** is checked ✅

### 3. Test the Implementation

```bash
# Make sure your API key is in .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here

# Start dev server
pnpm dev

# Visit http://localhost:3001
# Start typing an address in the hero input
# You should see autocomplete suggestions appear
```

## ✨ Benefits Over Manual Entry

| Manual Entry            | With Places Autocomplete |
| ----------------------- | ------------------------ |
| ❌ Typos and errors     | ✅ Verified addresses    |
| ❌ Incorrect formatting | ✅ Standardized format   |
| ❌ Ambiguous locations  | ✅ Precise coordinates   |
| ❌ Poor UX              | ✅ Professional UX       |
| ❌ Higher bounce rate   | ✅ Better conversions    |

## 🔧 Advanced Customization

### Bias to User's Location:

```typescript
const autocomplete = new window.google.maps.places.Autocomplete(
  inputRef.current,
  {
    types: ["address"],
    componentRestrictions: { country: ["pl", "de", "fr", "us"] },
    fields: ["formatted_address", "geometry"],
    // Bias results to user's current location
    location: new google.maps.LatLng(52.2297, 21.0122), // Warsaw
    radius: 50000, // 50km radius
  }
);
```

### Limit to Specific Region:

```typescript
const autocomplete = new window.google.maps.places.Autocomplete(
  inputRef.current,
  {
    types: ["address"],
    // Only show addresses in Warsaw metropolitan area
    bounds: new google.maps.LatLngBounds(
      new google.maps.LatLng(52.0975, 20.8514), // Southwest
      new google.maps.LatLng(52.3676, 21.2714) // Northeast
    ),
    strictBounds: true, // Only show results in bounds
  }
);
```

### Add Custom Placeholder:

```typescript
// In hero-section.tsx
<Input
  ref={inputRef}
  type="text"
  placeholder="np. ul. Marszałkowska 1, Warszawa"
  value={address}
  onChange={(e) => setAddress(e.target.value)}
  className="..."
  autoComplete="off"
/>
```

## 🐛 Troubleshooting

### Autocomplete not appearing?

1. **Check API key:**

   ```bash
   # In .env.local
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
   ```

2. **Verify Places API is enabled:**

   - Go to Google Cloud Console
   - Check "Places API" is enabled

3. **Check browser console:**

   ```
   F12 → Console
   Look for: "This API project is not authorized to use this API"
   ```

   If you see this, add Places API to your key restrictions.

4. **Check network tab:**
   ```
   F12 → Network → Filter "AutocompletionService"
   Should see requests to: https://maps.googleapis.com/maps/api/js/AutocompletionService
   ```

### Dropdown styling looks wrong?

- Clear browser cache
- Check `app/globals.css` has the `.pac-*` styles
- Verify CSS is loading (inspect element on dropdown)

### "This page can't load Google Maps correctly"?

- API key restrictions may be blocking localhost
- Check HTTP referrer restrictions in Google Cloud Console
- Ensure `http://localhost:3001/*` is allowed

### No suggestions for certain addresses?

- Check country restrictions in code
- Some addresses may not be in Google's database
- Try adding more characters (min 3 usually needed)

## 📊 Monitoring Usage

### Google Cloud Console:

1. Go to [APIs & Services → Dashboard](https://console.cloud.google.com/apis/dashboard)
2. Click "Places API"
3. View metrics:
   - Requests per day
   - Quota usage
   - Errors

### Set Up Billing Alerts:

1. Go to [Billing → Budgets & alerts](https://console.cloud.google.com/billing/budgets)
2. Create alert (e.g., notify at $10, $50, $100)
3. Get email notifications before overspending

## 🎯 Next Steps

### Optional Enhancements:

1. **Add "Detect My Location" button:**

   ```typescript
   const getUserLocation = () => {
     navigator.geolocation.getCurrentPosition((position) => {
       // Reverse geocode coordinates to address
       // Pre-fill the input
     });
   };
   ```

2. **Show mini-map preview on selection:**

   - Display small map when address selected
   - Confirm location visually

3. **Save recent searches:**

   ```typescript
   // Store in localStorage
   localStorage.setItem('recentAddresses', JSON.stringify([...]));
   ```

4. **Add validation:**

   - Require autocomplete selection
   - Prevent submission of non-autocompleted addresses

5. **Analytics tracking:**
   ```typescript
   autocomplete.addListener("place_changed", () => {
     // Track with Google Analytics
     gtag("event", "address_autocomplete_used");
   });
   ```

## 📚 Resources

- [Places Autocomplete Documentation](https://developers.google.com/maps/documentation/javascript/place-autocomplete)
- [Places API Pricing](https://developers.google.com/maps/billing/gmp-billing#ac-max)
- [Autocomplete Best Practices](https://developers.google.com/maps/documentation/javascript/places-autocomplete#best-practices)
- [Session Tokens Guide](https://developers.google.com/maps/documentation/javascript/place-autocomplete#session_tokens)

## 💡 Best Practices Being Followed

✅ **Session-based pricing** - Automatically grouped  
✅ **Country restrictions** - Reduces irrelevant results  
✅ **Limited fields** - Only request what's needed  
✅ **Proper cleanup** - Remove listeners on unmount  
✅ **Error handling** - Graceful fallback if API fails  
✅ **Styled dropdown** - Matches your theme perfectly  
✅ **Mobile responsive** - Works on all devices  
✅ **Accessibility** - Keyboard navigation supported

---

**Your Places API is now fully set up and optimized!** 🎉

Users can enjoy a professional address input experience with real-time suggestions, making it much easier to find their property for solar panel installation quotes.
