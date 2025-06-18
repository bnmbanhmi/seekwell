# HuggingFace AI Service Tests

## Running Tests

To run the tests for the HuggingFace AI service:

```bash
# Run all tests
npm test

# Run specific test file
npm test HuggingFaceAIService.test.ts

# Run tests in watch mode
npm test -- --watch
```

## Test Coverage

The tests cover:

1. **Configuration Tests**
   - API endpoint validation
   - Space information accuracy
   - Endpoint discovery

2. **Health Check Tests**
   - Service availability
   - Connection testing
   - Status monitoring

3. **Response Parsing Tests**
   - Classification result parsing
   - Error handling
   - Data format validation

4. **Risk Assessment Tests**
   - Risk level classification
   - Professional review requirements
   - Workflow logic validation

5. **Integration Tests** (optional)
   - Actual API connectivity
   - Space wake-up functionality
   - End-to-end validation

## Notes

- Integration tests are skipped by default (marked with `test.skip`)
- Enable integration tests only when testing against live HuggingFace Space
- Health checks may take longer due to cold start times
- Mock responses are used for unit tests to ensure fast execution

## API Documentation Reference

These tests validate the implementation against the official HuggingFace Gradio API:

```python
from gradio_client import Client, handle_file

client = Client("bnmbanhmi/seekwell-skin-cancer")
result = client.predict(
    image=handle_file('path/to/image.jpg'),
    api_name="/predict"
)
```

The JavaScript/TypeScript implementation mirrors this behavior using HTTP fetch requests.
