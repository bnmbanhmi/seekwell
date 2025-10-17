# ImgBB Integration Guide

## Overview
ImgBB is used to collect user-uploaded images (with consent) for AI model improvement.

## API Configuration

**Endpoint**: `https://api.imgbb.com/1/upload`  
**API Key**: `f4808957a454827017c2f8c137f4a035`  
**Method**: POST  
**Content-Type**: multipart/form-data

## Implementation

### Location
`frontend/src/components/ai/ImageUpload.tsx`

### Function: uploadToImgBB()

```typescript
const uploadToImgBB = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=f4808957a454827017c2f8c137f4a035`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    }
    return null;
  } catch (error) {
    console.error('ImgBB upload failed:', error);
    return null;
  }
};
```

## Usage Flow

1. User checks consent checkbox: `allowDataCollection`
2. User uploads image
3. `analyzeImage()` checks if consent is given
4. If yes, calls `uploadToImgBB(file)`
5. ImgBB returns URL
6. URL appended to notes: `${notes}\n[Image URL: ${imgbbUrl}]`
7. Enhanced notes sent to AI analysis

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "url": "https://i.ibb.co/abc123/image.jpg",
    "display_url": "https://i.ibb.co/abc123/image.jpg",
    "delete_url": "https://ibb.co/abc123/delete"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": 123
  }
}
```

## Error Handling

- Upload failures are **logged but not shown to user**
- Analysis **continues even if upload fails**
- Returns `null` on error (graceful degradation)
- No blocking of the main analysis flow

## Security & Privacy

### User Consent
- ✅ Explicit checkbox required
- ✅ Clear explanation provided
- ✅ Opt-in only (default: unchecked)

### Data Protection
- 🔒 Only image data is sent (no personal info)
- 🔒 HTTPS encryption
- 🔒 No user identification in image metadata
- 🔒 User notes are NOT sent to ImgBB (only to backend)

### Transparency
Alert message shown:
> "Ảnh của bạn sẽ được sử dụng để huấn luyện và cải thiện độ chính xác của mô hình AI. Chúng tôi cam kết bảo mật thông tin cá nhân của bạn."

## Backend Integration

The ImgBB URL is embedded in notes field:
```
User's original notes
[Image URL: https://i.ibb.co/abc123/image.jpg]
```

This allows:
- ✅ Easy parsing by backend
- ✅ Historical tracking
- ✅ Dataset building for model retraining
- ✅ Quality assurance/manual review

## Rate Limits

ImgBB Free Tier:
- No explicit rate limit documented
- Reasonable use expected
- Consider upgrading for production if needed

## Future Enhancements

### Recommended
1. **Image Compression**: Reduce file size before upload
2. **EXIF Stripping**: Remove metadata for privacy
3. **Upload Progress**: Show user upload status
4. **Retry Logic**: Automatic retry on network errors
5. **Analytics**: Track consent rate and upload success

### Optional
1. **Alternative Storage**: Consider S3/Azure Blob for production
2. **Image Validation**: Check for valid skin images
3. **Duplicate Detection**: Prevent duplicate uploads
4. **Batch Upload**: Support multiple images
5. **Consent Management**: Persist user preference

## Testing Checklist

- [ ] Checkbox toggles state correctly
- [ ] Upload succeeds with valid image
- [ ] URL is correctly appended to notes
- [ ] Analysis continues if upload fails
- [ ] No upload when checkbox unchecked
- [ ] Alert message displays correctly
- [ ] Both English and Vietnamese work
- [ ] Mobile/desktop responsive
- [ ] Network error handling
- [ ] Large file handling

## Monitoring

### Key Metrics to Track
- Consent rate (% of users checking box)
- Upload success rate
- Average upload time
- Image quality distribution
- Storage usage

### Logging
```javascript
// Current logging:
console.error('ImgBB upload failed:', error);

// Recommended additions:
- Upload attempt count
- Success/failure rate
- File size stats
- Response time
```

## API Key Management

⚠️ **Security Note**: API key is currently hardcoded. Consider:

1. **For Development**: Current approach is acceptable
2. **For Production**: 
   - Move to environment variables
   - Use backend proxy to hide key
   - Rotate keys periodically
   - Monitor usage/quota

## Support & Documentation

- ImgBB API Docs: https://api.imgbb.com/
- Account Dashboard: https://imgbb.com/
- Support: Through ImgBB website

## Contact

For questions about this integration, see:
- `AI_ANALYSIS_PAGE_IMPROVEMENTS.md` - Implementation details
- `AI_ANALYSIS_PAGE_STRUCTURE.md` - Page structure overview
