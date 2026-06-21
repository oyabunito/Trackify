export interface Artist {
  name: string;
  plays: string;
  monthly: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  plays: string;
  lyrics: string;
}

export interface HistoryEntry {
  tid: string;
  time: string;
  date: string;
  group: string;
}

export interface Genre {
  name: string;
  v: number;
}

export const artGradients: Record<string, string> = {
  'Kaïro':   'linear-gradient(135deg,#1ed760,#0b6b3a)',
  'Vipère':  'linear-gradient(135deg,#22d3ee,#0e5a6b)',
  'Brume':   'linear-gradient(135deg,#a78bfa,#4c1d95)',
  'Zélie':   'linear-gradient(135deg,#fb7185,#7f1d3a)',
  'Mehdi94': 'linear-gradient(135deg,#fbbf24,#92400e)',
  'Lassad':  'linear-gradient(135deg,#94a3b8,#334155)',
  'Nahla':   'linear-gradient(135deg,#f472b6,#831843)',
  'Vortex':  'linear-gradient(135deg,#34d399,#065f46)',
};

export const artists: Artist[] = [
  { name: 'Kaïro',   plays: '1 842 écoutes', monthly: '2,4M' },
  { name: 'Vipère',  plays: '1 506 écoutes', monthly: '1,8M' },
  { name: 'Brume',   plays: '1 233 écoutes', monthly: '1,2M' },
  { name: 'Zélie',   plays: '988 écoutes',   monthly: '890K' },
  { name: 'Mehdi94', plays: '742 écoutes',   monthly: '650K' },
  { name: 'Nahla',   plays: '511 écoutes',   monthly: '420K' },
];

export const tracks: Track[] = [
  { id: 't1',  title: 'Béton armé',       artist: 'Kaïro',   plays: '312', lyrics: "Sur le béton armé j'ai grandi sans filet\nLa nuit la ville respire et moi je compte les billets\nMaman m'a dit petit reste droit dans tes bottes\nAujourd'hui j'écris l'histoire pendant qu'ils prennent des notes" },
  { id: 't2',  title: 'Venin',            artist: 'Vipère',  plays: '287', lyrics: "Mon venin coule lentement dans la pénombre\nJ'avance masqué pendant qu'ils comptent les ombres\nPas d'ami dans le game juste des associés\nLa confiance c'est un luxe que j'peux pas m'payer" },
  { id: 't3',  title: "5 heures du mat'", artist: 'Brume',   plays: '264', lyrics: "Cinq heures du mat' la ville dort encore\nJ'allume une clope j'attends que se lève le décor\nTrop de rêves dans la tête pour fermer les yeux\nJ'rallume le studio j'fais parler les vieux" },
  { id: 't4',  title: 'Lumière noire',    artist: 'Zélie',   plays: '241', lyrics: "Dans la lumière noire je danse toute seule\nMon cœur est un quartier qu'on a mis sous scellés\nIls veulent ma place mais connaissent pas l'adresse\nJe transforme chaque blessure en or et en finesse" },
  { id: 't5',  title: 'Plein phares',     artist: 'Mehdi94', plays: '228', lyrics: "Plein phares sur l'autoroute du destin\nJe roule sans permis vers un meilleur matin\nLe neuf-quatre dans le sang jusqu'à la moelle\nOn part de rien on revient avec l'étoile" },
  { id: 't6',  title: 'Sombre',           artist: 'Lassad',  plays: '205', lyrics: "Sombre comme la cave où j'ai posé mes textes\nJ'ai troqué la peur contre un mic et un prétexte\nIls m'ont dit t'iras nulle part petit\nMaintenant c'est mon nom qu'ils crient toute la nuit" },
  { id: 't7',  title: 'Reine',            artist: 'Nahla',   plays: '198', lyrics: "Je suis montée sur le trône sans demander la permission\nReine de mon royaume bâti sur l'ambition\nIls parlent dans mon dos pendant que je compte les zéros\nLa couronne pèse lourd mais je la porte comme un héros" },
  { id: 't8',  title: 'Spirale',          artist: 'Vortex',  plays: '176', lyrics: "Je tourne dans la spirale je cherche la sortie\nLe succès m'aspire mais l'ego m'a trahi\nFaut que je garde la tête froide sous la pression\nChaque seconde compte je transforme l'essai en mission" },
  { id: 't9',  title: 'Cendres',          artist: 'Kaïro',   plays: '167', lyrics: "On renaît toujours de nos cendres\nLe feu nous a forgés trop tard pour faire semblant\nJ'ai brûlé tous les ponts pour avancer plus vite\nLa fumée raconte tout ce que ma bouche évite" },
  { id: 't10', title: 'Néon',             artist: 'Brume',   plays: '154', lyrics: "Sous les néons j'écris ma légende\nLa pluie tombe sur Paris la nuit est marchande\nJe vends des rêves en barre à ceux qui veulent y croire\nDemain m'appartient je l'ai lu dans le miroir" },
  { id: 't11', title: 'Antidote',         artist: 'Vipère',  plays: '142', lyrics: "T'as cherché l'antidote au mauvais endroit\nLe poison c'était toi depuis le premier soir\nJe recompte mes vrais sur les doigts d'une main\nLa solitude est reine quand t'as choisi ton chemin" },
  { id: 't12', title: 'Orage',            artist: 'Zélie',   plays: '131', lyrics: "J'avance sous l'orage sans parapluie\nLa foudre me connaît elle m'appelle par mon nom la nuit\nChaque éclair illumine le chemin que j'ai pris\nOn me voulait discrète je suis devenue l'incendie" },
];

export const genresRaw: Genre[] = [
  { name: 'Drill FR',      v: 32 },
  { name: 'Trap FR',       v: 26 },
  { name: 'Rap conscient', v: 14 },
  { name: 'Afrotrap',      v: 12 },
  { name: 'Cloud rap',     v: 9  },
  { name: 'Boom bap',      v: 7  },
];

export const genreColors = ['#1ed760','#19b14e','#7ef29a','#0e8f43','#b6f24a','#34d399'];

export const historyData: HistoryEntry[] = [
  { tid: 't9',  time: '14:32', date: "Aujourd'hui",      group: "Aujourd'hui" },
  { tid: 't2',  time: '13:58', date: "Aujourd'hui",      group: "Aujourd'hui" },
  { tid: 't10', time: '11:05', date: "Aujourd'hui",      group: "Aujourd'hui" },
  { tid: 't7',  time: '09:12', date: "Aujourd'hui",      group: "Aujourd'hui" },
  { tid: 't12', time: '23:47', date: 'Hier',             group: 'Hier' },
  { tid: 't5',  time: '22:30', date: 'Hier',             group: 'Hier' },
  { tid: 't1',  time: '18:20', date: 'Hier',             group: 'Hier' },
  { tid: 't8',  time: '17:55', date: 'Hier',             group: 'Hier' },
  { tid: 't11', time: '21:10', date: 'Ven. 13 juin',     group: 'Plus tôt cette semaine' },
  { tid: 't3',  time: '20:40', date: 'Ven. 13 juin',     group: 'Plus tôt cette semaine' },
  { tid: 't6',  time: '19:25', date: 'Jeu. 12 juin',     group: 'Plus tôt cette semaine' },
  { tid: 't4',  time: '08:50', date: 'Jeu. 12 juin',     group: 'Plus tôt cette semaine' },
  { tid: 't9',  time: '23:05', date: 'Mer. 11 juin',     group: 'Plus tôt cette semaine' },
  { tid: 't7',  time: '16:40', date: 'Mar. 10 juin',     group: 'Plus tôt cette semaine' },
  { tid: 't5',  time: '12:15', date: 'Lun. 9 juin',      group: 'Plus tôt cette semaine' },
  { tid: 't2',  time: '07:30', date: 'Lun. 9 juin',      group: 'Plus tôt cette semaine' },
];
