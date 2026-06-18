# Domain Recon - Testing Run Guide

This guide shows the fastest way to run the backend and frontend locally for testing.

## 1) Open the project

```powershell
cd "C:\Users\T450877L\OneDrive - TDSYNNEX\Documents\Projects\domain-recon"
```

## 2) Start the backend (Terminal 1)

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
py -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend test URL:
- Swagger docs: `http://localhost:8000/docs`

## 3) Start the frontend (Terminal 2)

```powershell
cd "C:\Users\T450877L\OneDrive - TDSYNNEX\Documents\Projects\domain-recon\frontend"
npm install
npm run dev
```

Frontend URL:
- App: `http://localhost:5173`

## 4) Test the app flow

1. Open `http://localhost:5173`
2. In the top bar, enter a domain like `example.com`
3. Click **Analyze**
4. Confirm a new row appears in the domain table
5. Click a row and verify details in the right panel (health score, tags, insights)
6. Try filters (Status, Region, Brand, Risk) and confirm results update

## 5) Test backend endpoint directly (optional)

Open `http://localhost:8000/docs` and run `POST /analyze` with:

```json
{
  "url": "https://example.com",
  "api_key": "supersecretkey123"
}
```

## 6) Common issues

- `Could not analyze domain...` in frontend:
  - Confirm backend is running on `http://localhost:8000`
- `Execution policy` blocks activation:
  - Run PowerShell as admin and execute:
    ```powershell
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```
- Port already used:
  - Backend: use another port in uvicorn and update frontend fetch URL
  - Frontend: Vite will usually offer another port automatically

## 7) Stop services

- In each terminal, press `Ctrl + C`

