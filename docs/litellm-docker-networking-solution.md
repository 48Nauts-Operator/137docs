# LiteLLM Docker Networking Solution

## 🔍 Issue Identified

When testing LiteLLM connection from the frontend, users were seeing connection failures with unclear error messages. The comprehensive network testing revealed the root cause.

## 🧪 Network Test Results

### From Docker Container Perspective:

| Address | Status | Details |
|---------|---------|---------|
| `192.168.1.131:4000` | ❌ **FAILED** | Connection timeout (not accessible from container) |
| `localhost:4000` | ❌ **FAILED** | Not accessible |
| `127.0.0.1:4000` | ❌ **FAILED** | Not accessible |
| `host.docker.internal:4000` | ✅ **SUCCESS** | Accessible (returns 404, meaning it's reachable) |

## 💡 Root Cause

**Docker Network Isolation**: When LiteLLM runs on your host machine (local IP `192.168.1.131`), the Docker container cannot access it directly via the local network IP. Docker containers need to use special hostnames to reach host services.

## ✅ Solution

**Use `host.docker.internal` instead of local IP addresses** when configuring LiteLLM from within Docker containers.

### ❌ **Wrong Configuration:**
```
Provider: LiteLLM Proxy
API URL: http://192.168.1.131:4000
API Key: sk-1234
```

### ✅ **Correct Configuration:**
```
Provider: LiteLLM Proxy
API URL: http://host.docker.internal:4000
API Key: sk-1234
```

## 🔧 Implementation

### 1. **Updated Default URLs**
The system now includes proper Docker networking defaults:

```python
# In src/backend/app/llm.py
defaults = {
    'local': 'http://host.docker.internal:11434',
    'openai': 'https://api.openai.com/v1',
    'anthropic': 'https://api.anthropic.com',
    'litellm': 'http://host.docker.internal:4000',  # ← Fixed!
    'custom': ''
}
```

### 2. **Enhanced Error Logging**
Improved error messages now show specific connection issues:

```python
# Before: Generic "Error querying LLM:"
# After: Specific errors like:
"Error: Connection timeout to http://192.168.1.131:4000"
"Error: Connection failed to http://192.168.1.131:4000: [ConnectError]"
```

## 📱 How to Fix for Users

### Option 1: Use the Default (Recommended)
1. **Provider**: Select "LiteLLM Proxy"
2. **API URL**: Leave empty (uses default `http://host.docker.internal:4000`)
3. **API Key**: Enter your virtual key (e.g., `sk-1234`)

### Option 2: Manual Configuration
1. **Provider**: Select "LiteLLM Proxy"
2. **API URL**: Enter `http://host.docker.internal:4000`
3. **API Key**: Enter your virtual key (e.g., `sk-1234`)

## 🧪 Testing Steps

### 1. **Start LiteLLM on Host**
```bash
# Make sure LiteLLM is running on your host machine
litellm --config config.yaml --port 4000
```

### 2. **Configure in 137Docs**
- Navigate to: http://localhost:3303 → Settings → AI/LLM tab
- Select "LiteLLM Proxy" provider
- Use `host.docker.internal:4000` as API URL
- Click "Test Connection"

### 3. **Expected Results**
- ✅ Connection successful
- ✅ Models discovered and displayed
- ✅ Dropdowns populated with available models

## 🔍 Troubleshooting

### If Still Getting Connection Errors:

1. **Check LiteLLM Status**
   ```bash
   curl http://localhost:4000/models
   ```

2. **Verify Docker can reach host**
   ```bash
   docker exec -it docai-image-backend-1 python -c "
   import httpx
   import asyncio
   async def test():
       async with httpx.AsyncClient() as client:
           response = await client.get('http://host.docker.internal:4000')
           print(f'Status: {response.status_code}')
   asyncio.run(test())
   "
   ```

3. **Check Backend Logs**
   ```bash
   docker-compose logs backend | grep -i "litellm\|error"
   ```

## 🌐 Network Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Host Machine (192.168.1.131)                                   │
│                                                                 │
│  ┌─────────────────┐                 ┌─────────────────────────┐ │
│  │ LiteLLM Service │                 │ Docker Environment      │ │
│  │ :4000           │                 │                         │ │
│  └─────────────────┘                 │  ┌─────────────────────┐ │ │
│           │                          │  │ Backend Container   │ │ │
│           │                          │  │                     │ │ │
│           └──────────────────────────┼──┤ host.docker.        │ │ │
│                                      │  │ internal:4000  ────┼─┘ │
│                                      │  └─────────────────────┘   │
│                                      └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┐

✅ Works: host.docker.internal:4000
❌ Fails: 192.168.1.131:4000 (network isolation)
```

## 📋 Summary

- **Issue**: Docker network isolation prevents direct access to host IP addresses
- **Solution**: Use `host.docker.internal` for Docker-to-host communication
- **Result**: LiteLLM connection now works properly with model discovery
- **Benefit**: Clear error messages help users troubleshoot connectivity issues

This fix ensures that LiteLLM integration works seamlessly in Docker environments while maintaining security and network isolation. 