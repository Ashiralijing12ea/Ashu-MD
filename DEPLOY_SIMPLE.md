# Deploy (Railway) — bohat aasaan

**Koi env variable set karna zaroori nahi.** Sab defaults pehle se set hain
(owner 923199047305, channels, welcome OFF, panel password, local storage).

1. GitHub par repo push karo -> Railway me "Deploy from GitHub".  `Dockerfile` khud ffmpeg + yt-dlp install karta hai.
2. **Volume lagao (zaroori, warna redeploy par sessions chale jate hain):** Railway > Service > Volumes > mount path `/app/data`.
3. Deploy. Site khulne par pair page se number connect karo.
4. Admin panel: `/panel` (default password `@ashumd14` — badalna ho to Variable `ASHU_PANEL_TOKEN` set karo, optional).

## Optional variables (sirf zaroorat par)
| Variable | Kaam |
|---|---|
| `ASHU_PANEL_TOKEN` | panel ka password badalne ke liye |
| `MONGODB_URI` | MongoDB use karna ho to (warna local file storage chalta hai) |
| `MAX_SESSIONS` | ek server par numbers ki hadd |

Health check: `/api/health`. Crash par Railway khud restart karta hai (10 tak).
