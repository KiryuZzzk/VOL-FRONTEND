import { useState, useEffect, useRef } from "react";
import {
  List,
  ListItem,
  ListItemText,
  Box,
  ListItemIcon,
} from "@mui/material";
import { FaTools, FaAward, FaChevronDown, FaChevronUp, FaUser, FaFileAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { MdFactCheck, MdAccessTimeFilled } from "react-icons/md";
import { FaAddressCard } from "react-icons/fa6";
import { FaArrowTrendUp } from "react-icons/fa6";

import SearchPanel from "./SearchPanel";
import ProfileEditModal from "./ProfileEditModal";
import SearchPanelDoc from "./SearchPanelDoc";
import SearchPanelProgreso from "./SearchPanelProgreso"; // ✅ NUEVO

const disabledMenus = [
  "Credenciales",
  "Certificados",
  "Programas inscritos",
  "Disponibilidad",
];

const menuItems = [
  {
    title: "Perfiles",
    icon: <FaUser />,
    subItems: [
      "Consultar todos los perfiles",
      "Editar el perfil de un usuario",
    ],
  },
  {
    title: "Documentos",
    icon: <FaFileAlt />,
    subItems: ["Consultar documentos de todos los aspirantes"],
  },
  {
    title: "Disponibilidad",
    icon: <MdAccessTimeFilled />,
    subItems: ["Consultar disponibilidad de todos los aspirantes"],
  },
  {
    title: "Certificados",
    icon: <FaAward />,
    subItems: [
      "Consultar certificados de todos los aspirantes",
      "Editar un certificado",
      "Añadir un certificado",
      "Eliminar un certificado",
    ],
  },
  {
    title: "Progreso",
    icon: <FaArrowTrendUp />,
    subItems: ["Consultar progreso de todos los aspirantes"], // ✅ Usaremos este label
  },
  {
    title: "Programas inscritos",
    icon: <MdFactCheck />,
    subItems: ["Consultar los programas inscritos de todos los aspirantes"],
  },
  {
    title: "Credenciales",
    icon: <FaAddressCard />,
    subItems: ["Consultar las credenciales de todos los aspirantes"],
  },
];

export default function AdminSidebarMenu() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});

  // Estados para modales
  const [modalListOpen, setModalListOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [modalListDocOpen, setModalListDocOpen] = useState(false);
  const [modalProgresoOpen, setModalProgresoOpen] = useState(false); // ✅ NUEVO

  const [profileToEdit, setProfileToEdit] = useState(null);

  const sidebarRef = useRef(null);

  const toggleSidebar = () => setOpenSidebar((o) => !o);
  const handleSubmenuToggle = (title) => {
    if (disabledMenus.includes(title)) return;
    setOpenSubmenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleSubItemClick = (label) => {
    if (label === "Consultar todos los perfiles") {
      setModalListOpen(true);
    } else if (label === "Editar el perfil de un usuario") {
      setModalEditOpen(true);
    } else if (label === "Consultar documentos de todos los aspirantes") {
      setModalListDocOpen(true);
    } else if (label === "Consultar progreso de todos los aspirantes") {
      setModalProgresoOpen(true); // ✅ abre el panel de progreso
    } else {
      alert(`Funcionalidad para "${label}" no implementada aún.`);
    }
    setOpenSidebar(false);
  };

  // Al seleccionar perfil desde el buscador:
  const onSelectProfileForEdit = (profile) => {
    setProfileToEdit(profile);
    setModalListOpen(false);
    setModalEditOpen(true);
    setModalListDocOpen(false);
    setModalProgresoOpen(false);
  };

  // Bloquear scroll y manejar foco cuando el sidebar está abierto
  useEffect(() => {
    if (openSidebar) {
      document.body.style.overflow = "hidden";
      if (sidebarRef.current) {
        sidebarRef.current.focus();
      }
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [openSidebar]);

  // Cerrar sidebar si se presiona Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && openSidebar) {
        setOpenSidebar(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openSidebar]);

  return (
    <>
      {/* BOTÓN Y MENÚ LATERAL */}
      <Box
        sx={{
          position: "fixed",
          top: "50%",
          left: 0,
          transform: "translateY(-50%)",
          zIndex: 1300,
          backgroundColor: "#fff8ff",
          borderRadius: "0 10px 10px 0",
          boxShadow: "0 0 12px rgba(255, 0, 0, 0.3)",
          padding: 1.5,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.3,
          userSelect: "none",
          "&:hover": { backgroundColor: "#ffe5e5" },
        }}
        onClick={toggleSidebar}
        aria-label="Abrir menú de administración"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleSidebar();
          }
        }}
      >
        <FaTools size={26} color="#e60000" />
        <Box
          sx={{
            fontSize: "0.8rem",
            color: "#b30000",
            fontWeight: "600",
            letterSpacing: "0.05em",
          }}
        >
          Admin
        </Box>
      </Box>

      {/* BACKDROP */}
      <AnimatePresence>
        {openSidebar && (
          <>
            <motion.div
              onClick={() => setOpenSidebar(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "black",
                zIndex: 2000,
              }}
              aria-hidden="true"
            />
            {/* SIDEBAR */}
            <motion.nav
              ref={sidebarRef}
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                height: "100vh",
                width: 320,
                backgroundColor: "#f7f0fa",
                boxShadow: "0 8px 24px rgba(255, 0, 0, 0.35), 0 4px 8px rgba(0,0,0,0.1)",
                paddingTop: 16,
                paddingLeft: 8,
                paddingRight: 8,
                zIndex: 2001,
                outline: "none",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <List sx={{ px: 1 }}>
                {menuItems.map(({ title, subItems, icon }) => {
                  const isOpen = !!openSubmenus[title];
                  const isDisabled = disabledMenus.includes(title);

                  return (
                    <Box
                      key={title}
                      sx={{
                        borderBottom: "1px solid #ddd",
                        pointerEvents: isDisabled ? "none" : "auto",
                        opacity: isDisabled ? 0.5 : 1,
                        userSelect: isDisabled ? "none" : "auto",
                      }}
                    >
                      <ListItem
                        button={!isDisabled}
                        onClick={() => handleSubmenuToggle(title)}
                        sx={{
                          "&:hover": {
                            backgroundColor: isDisabled ? "transparent" : "#ffe5e5",
                          },
                          paddingY: 1.2,
                          gap: 1,
                          cursor: isDisabled ? "default" : "pointer",
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 36,
                            color: isOpen ? "#e60000" : isDisabled ? "#aaa" : "#aa0000",
                            transition: "color 0.3s",
                          }}
                        >
                          {icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={title}
                          primaryTypographyProps={{
                            fontWeight: "700",
                            fontSize: "1rem",
                            color: isOpen ? "#e60000" : isDisabled ? "#aaa" : "#888888",
                            letterSpacing: "0.04em",
                            transition: "color 0.3s",
                          }}
                        />
                        {!isDisabled &&
                          (isOpen ? (
                            <FaChevronUp color="#e60000" />
                          ) : (
                            <FaChevronDown color="#aa0000" />
                          ))}
                      </ListItem>

                      <AnimatePresence>
                        {isOpen && !isDisabled && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <List component="div" disablePadding>
                              {subItems.map((subItem, idx) => (
                                <ListItem
                                  key={idx}
                                  sx={{
                                    pl: 6,
                                    py: 0.8,
                                    borderBottom:
                                      idx !== subItems.length - 1 ? "1px solid #eee" : "none",
                                    "&:hover": { backgroundColor: "#ffebeb", color: "#b30000" },
                                    cursor: "pointer",
                                    userSelect: "none",
                                  }}
                                  button
                                  component={motion.div}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -10 }}
                                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                                  onClick={() => handleSubItemClick(subItem)}
                                >
                                  <ListItemText
                                    primary={subItem}
                                    primaryTypographyProps={{
                                      fontSize: "0.85rem",
                                      color: "#660000",
                                      fontWeight: 500,
                                    }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  );
                })}
              </List>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* MODALES */}
      <SearchPanel
        isOpen={modalListOpen}
        onClose={() => setModalListOpen(false)}
        // onSelectProfile={onSelectProfileForEdit}
      />

      <ProfileEditModal
        open={modalEditOpen}
        onClose={() => setModalEditOpen(false)}
        profile={profileToEdit}
        clearProfile={() => setProfileToEdit(null)}
      />

      <SearchPanelDoc
        isOpen={modalListDocOpen}
        onClose={() => setModalListDocOpen(false)}
        // onSelectProfile={onSelectProfileForEdit}
      />

      {/* ✅ NUEVO: Panel de PROGRESO */}
      <SearchPanelProgreso
        isOpen={modalProgresoOpen}
        onClose={() => setModalProgresoOpen(false)}
        // Puedes pasar callbacks si más adelante quieres seleccionar usuario, etc.
      />
    </>
  );
}
