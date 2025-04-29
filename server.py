from fastapi import FastAPI, Request
import httpx

app = FastAPI()

@app.post("/api1")
async def api1(request: Request):
    data = await request.json()
    message = data.get("message")
    if message:
        await make_api_call(message)
    return {"status": "API1 received the message"}

@app.post("/api2")
async def api2(request: Request):
    data = await request.json()
    message = data.get("message")
    if message:
        await make_api_call(message)
    return {"status": "API2 received the message"}

@app.post("/api3")
async def api3(request: Request):
    data = await request.json()
    message = data.get("message")
    if message:
        await make_api_call(message)
    return {"status": "API3 received the message"}

@app.post("/api4")
async def api4(request: Request):
    data = await request.json()
    message = data.get("message")
    if message:
        await make_api_call(message)
    return {"status": "API4 received the message"}

async def make_api_call(message: str):
    async with httpx.AsyncClient() as client:
        response = await client.post("http://example.com/endpoint", json={"message": message})
        return response.json()