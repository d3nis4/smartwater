import Ceata from '../assets/weatherImages/ceata.png';
import FurtunaNoaptea from '../assets/weatherImages/furtuna-noaptea.png';
import Furtuna from '../assets/weatherImages/furtuna.png';
import LunaCeata from '../assets/weatherImages/luna ceata.png';
import LunaNorNinsoare from '../assets/weatherImages/luna-nor-ninsoare.png';
import LunaNorPloaie from '../assets/weatherImages/luna-nor-ploaie.png';
import LunaNorTunet from '../assets/weatherImages/luna-nor-tunet.png';
import LunaNorVant from '../assets/weatherImages/luna-nor-vant.png';
import LunaSenin from '../assets/weatherImages/luna-senin.png';
import Ninsoare from '../assets/weatherImages/ninsoare.png';
import NorCeata from '../assets/weatherImages/nor-ceata.png';
import NorLuna from '../assets/weatherImages/nor-luna.png';
import NorNinsoare from '../assets/weatherImages/nor-ninsoare.png';
import RainAndSleetMix from '../assets/weatherImages/lapovita.png';

import NorSoareHeavyrain from '../assets/weatherImages/nor-soare-heavyrain.png';
import NorSoareNinsoare from '../assets/weatherImages/nor-soare-ninsoare.png';
import NorSoarePloaie from '../assets/weatherImages/nor-soare-ploaie.png';
import NorSoareTunete from '../assets/weatherImages/nor-soare-tunete.png';
import NorSoare from '../assets/weatherImages/nor-soare.png';
import NorVant from '../assets/weatherImages/nor-vant.png';
import Nor from '../assets/weatherImages/nor.png';
import Soare from '../assets/weatherImages/soare.png';
import Tornada from '../assets/weatherImages/tornada.png';
import Tunete from '../assets/weatherImages/tunete.png';
import Vant from '../assets/weatherImages/vant.png';
import Nea from '../assets/weatherImages/nea.png'
import Chiciura from '../assets/weatherImages/chiciura.png'
export const weatherImages = {
  day: {
    "Soare": Soare,
    "Senin": Soare,
    "Parțial noros": NorSoare,
    "Noros": Nor,
    "Cer acoperit": Nor,
    "Ceață": Ceata,
    "Ceață densă": NorCeata,
    "Tunete în apropiere": Tunete,
    "Ploi moderate": NorSoarePloaie,
    "Ploi uşoare": NorSoarePloaie,
    "Ploi moderate uneori": NorSoareHeavyrain,
    "Ploi pe porţiuni în apropiere": NorSoarePloaie,
    "Ploi uşoare şi de scurtă durată": NorSoarePloaie,
    "Ploi uşoare pe alocuri": NorSoarePloaie,
    "Ploaie torențială": NorSoareHeavyrain,
    "Ploaie torențială uneori": NorSoareHeavyrain,
    "Ploaie torențială de scurtă durată": NorSoareHeavyrain,
    "Ploi de scurtă durată moderate sau în cantităţi însemnate": NorSoareHeavyrain,
    "Grindină": NorSoareTunete,
    "Ploi în cantităţi mici însoţite de grindină": NorSoareTunete,
    "Ploi în cantităţi mari şi moderate însoțite de grindină": NorSoareTunete,
    "Ploi în cantităţi mici pe porțiuni însoțite de tunete": Tunete,
    "Ploi în cantităţi mari şi moderate pe porțiuni însoțite de tunete": Furtuna,
    "Ninsori pe porţiuni în apropiere": NorNinsoare,
    "Ninsori în cantităţi mici": NorNinsoare,
    "Ninsori în cantităţi mici pe alocuri": NorNinsoare,
    "Ninsori moderate": Ninsoare,
    "Ninsori moderate pe alocuri": Ninsoare,
    "Ninsori în cantităţi mari pe porţiuni": NorSoareNinsoare,
    "Ninsori în cantităţi însemnate": NorSoareNinsoare,
    "Lapoviță pe porţiuni în apropiere": RainAndSleetMix,
    "Lapoviță în cantităţi mici": RainAndSleetMix,
    "Lapoviță în cantităţi mari şi moderate": RainAndSleetMix,
    "Lapoviță de scurtă durată în cantităţi mici": RainAndSleetMix,
    "Lapoviță de scurtă durată în cantităţi mari şi moderate": RainAndSleetMix,
    "Burniță şi polei pe porţiuni în apropiere": Ceata,
    "Burniță uşoară pe porțiuni": Nea,
    "Burniță uşoară": Nea,
    "Burniță înghețată în cantităţi însemnate": Nea,
    "Burniță înghețată":Nea,
    "Chiciură":Nea,
    "Viscol": Tornada,
    "Ninsoare viscolită": Tornada,
    "Vânt": Vant,
    "Nor cu vânt": NorVant,
  },
  night: {
    "Soare noaptea": LunaSenin,
    "Senin noaptea": LunaSenin,
    "Parțial noros noaptea": NorLuna,
    "Noros noaptea": NorLuna,
    "Cer acoperit noaptea": NorLuna,
    "Ceață noaptea": LunaCeata,
    "Ceață densă noaptea": LunaCeata,
    "Tunete în apropiere noaptea": LunaNorTunet,
    "Ploi moderate noaptea": LunaNorPloaie,
    "Ploi uşoare noaptea": LunaNorPloaie,
    "Ploi moderate uneori noaptea": LunaNorPloaie,
    "Ploi pe porţiuni în apropiere noaptea": LunaNorPloaie,
    "Ploi ușoare și de scurtă durată noaptea": LunaNorPloaie,
    "Ploi uşoare pe alocuri noaptea": LunaNorPloaie,
    "Ploaie torențială noaptea": LunaNorPloaie,
    "Ploaie torențială uneori noaptea": LunaNorPloaie,
    "Ploai ușoare și de scurtă durată noaptea": LunaNorPloaie,
     "Ploi uşoare şi de scurtă durată noaptea": LunaNorPloaie,
    "Ploaie torențială de scurtă durată noaptea": LunaNorPloaie,
    "Ploi de scurtă durată moderate sau în cantităţi însemnate noaptea": LunaNorPloaie,
    "Grindină noaptea": LunaNorTunet,
    "Ploi în cantităţi mici însoţite de grindină noaptea": LunaNorTunet,
    "Ploi în cantităţi mari şi moderate însoțite de grindină noaptea": LunaNorTunet,
    "Ploi în cantităţi mici pe porțiuni însoțite de tunete noaptea": LunaNorTunet,
    "Ploi în cantităţi mari şi moderate pe porțiuni însoțite de tunete noaptea": FurtunaNoaptea,
    "Ninsori pe porţiuni în apropiere noaptea": LunaNorNinsoare,
    "Ninsori în cantităţi mici noaptea": LunaNorNinsoare,
    "Ninsori în cantităţi mici pe alocuri noaptea": LunaNorNinsoare,
    "Ninsori moderate noaptea": LunaNorNinsoare,
    "Ninsori moderate pe alocuri noaptea": LunaNorNinsoare,
    "Ninsori în cantităţi mari pe porţiuni noaptea": LunaNorNinsoare,
    "Ninsori în cantităţi însemnate noaptea": LunaNorNinsoare,
    "Ninsori în cantităţi mici pe porţiuni însoțite de tunete noaptea": LunaNorTunet,
    "Ninsori în cantităţi mari şi moderate pe porţiuni însoțite de tunete noaptea": FurtunaNoaptea,
    "Lapoviță pe porţiuni în apropiere noaptea": RainAndSleetMix,
    "Lapoviță în cantităţi mici noaptea": RainAndSleetMix,
    "Lapoviță în cantităţi mari şi moderate noaptea": RainAndSleetMix,
    "Lapoviță de scurtă durată în cantităţi mici noaptea": RainAndSleetMix,
    "Lapoviță de scurtă durată în cantităţi mari şi moderate noaptea": RainAndSleetMix,
    "Burniță şi polei pe porţiuni în apropiere noaptea": LunaCeata,
    "Burniță uşoară pe porțiuni noaptea": NorLuna,
    "Burniță uşoară noaptea": NorLuna,
    "Burniță înghețată în cantităţi însemnate noaptea": LunaCeata,
    "Burniță înghețată noaptea": LunaCeata,
    "Chiciură noaptea": LunaCeata,
    "Viscol noaptea": Tornada,
    "Ninsoare viscolită noaptea": Tornada,
    "Vânt noaptea": LunaNorVant,
    "Nor cu vânt noaptea": LunaNorVant,
  }
};
