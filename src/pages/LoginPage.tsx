import { useState, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

const keyframesStyle = `
@keyframes tkfloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-18px) rotate(3deg); }
}
@keyframes tkfloat2 {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-14px) rotate(-4deg); }
}
@keyframes tkpulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .4; transform: scale(.85); }
}
@keyframes tkrise {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [synced, setSynced] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const handleSpotify = () => {
    if (synced) {
      navigate("/dashboard");
    } else {
      setSynced(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  const albumCover = (
    top: string,
    right: string | undefined,
    left: string | undefined,
    w: number,
    h: number,
    br: number,
    gradient: string,
    shadow: string,
    animation: string
  ): CSSProperties => ({
    position: "absolute",
    top,
    ...(right !== undefined ? { right } : {}),
    ...(left !== undefined ? { left } : {}),
    width: w,
    height: h,
    borderRadius: br,
    background: gradient,
    boxShadow: `${shadow}, inset 0 0 0 1px rgba(255,255,255,.08)`,
    animation,
    pointerEvents: "none",
  });

  const inputBase: CSSProperties = {
    width: "100%",
    background: "#1a201d",
    border: "1px solid rgba(255,255,255,.1)",
    borderRadius: 12,
    padding: "16px 18px",
    color: "#e9efe9",
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color .2s, box-shadow .2s",
    boxSizing: "border-box",
  };

  const labelStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#6b746c",
    letterSpacing: ".1em",
    marginBottom: 8,
    display: "block",
  };

  return (
    <>
      <style>{keyframesStyle}</style>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          fontFamily: "'Figtree', sans-serif",
          color: "#e9efe9",
        }}
      >
        {/* Left column */}
        <div
          style={{
            flex: 1.05,
            background:
              "radial-gradient(120% 120% at 18% 8%, rgba(30,215,96,.16), transparent 52%), #0b0f0d",
            padding: "56px 56px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Floating album covers */}
          <div
            style={albumCover(
              "14%",
              "12%",
              undefined,
              132,
              132,
              22,
              "linear-gradient(135deg,#1ed760,#0b6b3a)",
              "0 20px 50px rgba(0,0,0,.5)",
              "tkfloat 7s ease-in-out infinite"
            )}
          />
          <div
            style={albumCover(
              "40%",
              "30%",
              undefined,
              96,
              96,
              18,
              "linear-gradient(135deg,#a78bfa,#4c1d95)",
              "0 22px 55px rgba(0,0,0,.52)",
              "tkfloat2 9s ease-in-out infinite"
            )}
          />
          <div
            style={{
              position: "absolute",
              bottom: "20%",
              right: "18%",
              width: 110,
              height: 110,
              borderRadius: 20,
              background: "linear-gradient(135deg,#22d3ee,#0e5a6b)",
              boxShadow: "0 24px 60px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.08)",
              animation: "tkfloat 8.5s ease-in-out infinite .6s",
              pointerEvents: "none",
            }}
          />

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, zIndex: 1 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg,#1ed760,#0b6b3a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 800,
                fontSize: 22,
                color: "#052a16",
              }}
            >
              T
            </div>
            <span
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 800,
                fontSize: 22,
                letterSpacing: "-.02em",
              }}
            >
              Trackify
            </span>
          </div>

          {/* Pitch */}
          <div style={{ zIndex: 1 }}>
            <h1
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 800,
                fontSize: 72,
                lineHeight: 1.04,
                letterSpacing: "-.035em",
                margin: 0,
              }}
            >
              Ton écoute,
              <br />
              décryptée.
            </h1>
            <p
              style={{
                fontSize: 22,
                lineHeight: 1.6,
                color: "#8a958d",
                maxWidth: 520,
                marginTop: 24,
              }}
            >
              Top artistes, historique des 7 derniers jours et recherche de
              paroles dans tes morceaux — le tout au même endroit.
            </p>
          </div>

          {/* Footer */}
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 12,
              color: "#4d564f",
              letterSpacing: ".05em",
              zIndex: 1,
            }}
          >
            © 2026 Trackify · ton dashboard musical
          </div>
        </div>

        {/* Sync badge */}
        <div
          style={{
            position: "absolute",
            top: 28,
            right: 32,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 13px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 500,
            background: synced
              ? "rgba(30,215,96,.1)"
              : "rgba(239,68,68,.1)",
            border: `1px solid ${
              synced ? "rgba(30,215,96,.25)" : "rgba(239,68,68,.28)"
            }`,
            color: synced ? "#1ed760" : "#f87171",
            transition: "background .3s, border-color .3s",
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: synced ? "#1ed760" : "#f87171",
              animation: "tkpulse 2s infinite",
            }}
          />
          {synced
            ? "Synchronisé avec ton compte Spotify"
            : "Pas encore synchronisé avec Spotify"}
        </div>

        {/* Right column */}
        <div
          style={{
            flex: 1,
            background:
              "radial-gradient(110% 90% at 88% 12%, rgba(30,215,96,.06), transparent 55%), linear-gradient(180deg, #101513 0%, #0c0f0e 100%)",
            borderLeft: "1px solid rgba(255,255,255,.05)",
            padding: "40px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              maxWidth: 460,
              width: "100%",
              animation: "tkrise .5s",
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: 38 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#8a958d",
                  marginBottom: 8,
                }}
              >
                Content de te revoir
              </div>
              <div
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 800,
                  fontSize: 38,
                }}
              >
                Connexion
              </div>
            </div>

            {/* Spotify button */}
            <button
              onClick={handleSpotify}
              onMouseEnter={() => setHoveredBtn("spotify")}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                width: "100%",
                padding: 17,
                borderRadius: 14,
                background:
                  hoveredBtn === "spotify" ? "#1adf63" : "#1ed760",
                color: "#052a16",
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "inherit",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                transition: "background .2s",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="#052a16"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 1 1-.277-1.215c3.809-.871 7.077-.496 9.712 1.115a.623.623 0 0 1 .207.857zm1.223-2.722a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 1 1-.452-1.493c3.632-1.102 8.147-.568 11.232 1.329a.78.78 0 0 1 .257 1.073zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.935.935 0 1 1-.542-1.79c3.532-1.072 9.404-.865 13.115 1.338a.935.935 0 1 1-.954 1.609z" />
              </svg>
              {synced ? "Accéder au dashboard" : "Continuer avec Spotify"}
            </button>

            {/* Separator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                margin: "28px 0",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(255,255,255,.08)",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "#4d564f",
                  whiteSpace: "nowrap",
                }}
              >
                OU PAR E-MAIL
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(255,255,255,.08)",
                }}
              />
            </div>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>E-MAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="theo@spotify.com"
                  style={inputBase}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#1ed760";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(30,215,96,.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    MOT DE PASSE
                  </label>
                  <span
                    onMouseEnter={() => setHoveredBtn("forgot")}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color:
                        hoveredBtn === "forgot" ? "#1ed760" : "#8a958d",
                      cursor: "pointer",
                      transition: "color .2s",
                    }}
                  >
                    Oublié ?
                  </span>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ ...inputBase, paddingRight: 48 }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#1ed760";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px rgba(30,215,96,.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,.1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#6b746c",
                      padding: 0,
                      display: "flex",
                    }}
                  >
                    {showPw ? (
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    ) : (
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember checkbox */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 28,
                }}
              >
                <div
                  onClick={() => setRemember(!remember)}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    background: remember ? "#1ed760" : "transparent",
                    border: remember
                      ? "none"
                      : "1px solid rgba(255,255,255,.22)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#052a16",
                    flexShrink: 0,
                    transition: "background .2s",
                  }}
                >
                  {remember && "✓"}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#9aa39b",
                    cursor: "pointer",
                  }}
                  onClick={() => setRemember(!remember)}
                >
                  Rester connecté
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                onMouseEnter={() => setHoveredBtn("submit")}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  width: "100%",
                  padding: 17,
                  borderRadius: 14,
                  background:
                    hoveredBtn === "submit"
                      ? "rgba(255,255,255,.08)"
                      : "rgba(255,255,255,.04)",
                  border: "1px solid rgba(255,255,255,.14)",
                  color: "#e9efe9",
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  transition: "background .2s",
                }}
              >
                Se connecter
              </button>
            </form>

            {/* Sign up */}
            <div
              style={{
                textAlign: "center",
                marginTop: 28,
                fontSize: 14,
                color: "#8a958d",
              }}
            >
              Pas encore de compte ?{" "}
              <span
                onClick={() => {}}
                onMouseEnter={() => setHoveredBtn("signup")}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  color: "#1ed760",
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration:
                    hoveredBtn === "signup" ? "underline" : "none",
                  transition: "text-decoration .2s",
                }}
              >
                Créer un compte
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
