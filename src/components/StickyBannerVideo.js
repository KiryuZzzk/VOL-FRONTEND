import React, { useState } from "react";
import { Box, Typography, Button, Modal, useMediaQuery } from "@mui/material";
import { FiVolume2, FiX } from "react-icons/fi";

const StickyBannerVideo = () => {
  const [open, setOpen] = useState(false);

  // 🔍 Breakpoints
  const isTiny = useMediaQuery("(max-width:400px)");
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");

  // 🧠 Leyenda adaptativa
  const message = isTiny
    ? "Mensaje del Presidente Nacional"
    : isMobile
    ? "El Presidente Nacional te habla — haz click"
    : "El Presidente Nacional tiene algo que decirte — haz click aquí";

  const handleOpen = (e) => {
    e.stopPropagation();
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  return (
    <>
      <Box
        onClick={handleOpen}
        sx={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          px: isTiny ? 1.5 : 2.5,
          py: 1.2,
          bgcolor: "#ff3333",
          color: "#fff8ff",
          borderRadius: "30px",
          display: "flex",
          flexDirection: isTiny ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          zIndex: 2000,
          boxShadow: "0 0 15px 3px rgba(255, 51, 51, 0.7)",
          animation: "pulseRed 2.5s infinite",
          maxWidth: "95vw",
          textAlign: "center",
          userSelect: "none",
        }}
      >
        <style>{`
          @keyframes pulseRed {
            0%, 100% {
              box-shadow: 0 0 15px 3px rgba(255, 51, 51, 0.7);
            }
            50% {
              box-shadow: 0 0 25px 6px rgba(255, 51, 51, 1);
            }
          }
        `}</style>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            whiteSpace: "nowrap",
            flexWrap: "nowrap",
            fontSize: isTiny ? "0.78rem" : isMobile ? "0.9rem" : "1rem",
          }}
        >
          <FiVolume2 size={isMobile ? 18 : 22} />
          <Typography>{message}</Typography>
        </Box>

        {!isTiny && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleOpen}
            sx={{
              ml: isTablet ? 0.5 : 1,
              color: "#fff8ff",
              borderColor: "#fff8ff",
              fontSize: "0.75rem",
              padding: "2px 10px",
              whiteSpace: "nowrap",
              minWidth: "auto",
              "&:hover": {
                backgroundColor: "#fff8ff",
                color: "#ff3333",
              },
            }}
          >
            Ver video
          </Button>
        )}
      </Box>

      {/* 🎥 Modal con video */}
      <Modal
        open={open}
        onClose={handleClose}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          backgroundColor: "rgba(0,0,0,0.6)",
          zIndex: 2100,
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: isMobile ? "90vw" : "60vw",
            height: isMobile ? "50vh" : "60vh",
            bgcolor: "#fff8ff",
            borderRadius: 3,
            boxShadow: 24,
            p: 2,
          }}
        >
          <Button
            onClick={handleClose}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              minWidth: "auto",
              color: "#ff3333",
              fontWeight: "bold",
              zIndex: 2200,
            }}
          >
            <FiX size={24} />
          </Button>

          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Video del Presidente Nacional"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius: "8px" }}
          />
        </Box>
      </Modal>
    </>
  );
};

export default StickyBannerVideo;

