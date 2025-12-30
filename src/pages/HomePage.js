
import BackgroundAnimated from "../components/BackgroundAnimated";
import QueEsVoluntario from "../components/QueEsVoluntario";
import NuestrosProgramas from "../components/NuestrosProgramas";
import BackgroundAnimatedWaveTop from "../components/BackgroundAnimatedWaveTop";
import FlyerStories from "../components/FlyerStories";
import MensajePresidencial from "../components/MensajePresidencial";

import QueEsCRM from "../components/QueEsCRM";
import PrincipiosFundamentales from "../components/PrincipiosFundamentales";
import CorazonVoluntariado from "../components/CorazonVoluntariado";
import LineaDeTiempoPasos from "../components/LineaDeTiempoPasos";
import ModalidadVoluntariado from "../components/ModalidadVoluntariado";

const HomePage = ({ setPageType, pageType }) => {


  return (
    <>
    <BackgroundAnimated  pageType={pageType} setPageType = {setPageType}/>

    <QueEsCRM />
    <PrincipiosFundamentales />
    <CorazonVoluntariado />
    <QueEsVoluntario />

    <MensajePresidencial />
    
    <LineaDeTiempoPasos />
    <ModalidadVoluntariado />

    <NuestrosProgramas  pageType={pageType} setPageType = {setPageType}/>
     <BackgroundAnimatedWaveTop  pageType={pageType} setPageType = {setPageType}/>
    </>
  );
};

export default HomePage;
