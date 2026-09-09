import { ImageResponse } from "next/og";

export const alt = "Amanuel Berhanu — Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#F2F4F8",
          borderLeft: "24px solid #D6336C",
        }}
      >
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, color: "#23244E" }}>
          Amanuel Berhanu
        </div>
        <div style={{ display: "flex", fontSize: 40, color: "#4A4C7D", marginTop: 24 }}>
          I build software-related products, from data models to interfaces.
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 28, color: "#3542E8" }}>
          Case studies with honest write-ups
        </div>
      </div>
    ),
    size,
  );
}
