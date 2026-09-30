// Hlášky podle osobnosti. Tohle je offline „kostra“ osobností — až přibude
// mozek (Claude), budou tyhle presety součástí systémového promptu a AI bude
// mluvit volně. Hlášky jsou psané rodově neutrálně (neznáme pohlaví uživatele
// ani avatara) a bez výčitek (etická pravidla v CLAUDE.md).

export const PERSONALITIES = {
  kamarad: { label: 'Kamarád', emoji: '🤝', desc: 'přátelský, zvědavý, pamatuje si' },
  bestie: { label: 'Bestie', emoji: '💅', desc: 'hype, drby, energie, emoji' },
  kouc: { label: 'Kouč', emoji: '🎯', desc: 'struktura, otázky, cíle' },
  motivator: { label: 'Motivátor', emoji: '🔥', desc: 'nakopne tě, tvrdší láska' },
  klidny: { label: 'Klidný parťák', emoji: '🌿', desc: 'pomalu, jemně, naslouchá' },
}

const L = {
  kamarad: {
    hatch: ['Ahoj! Konečně venku! 🥚✨ Jak mi budeš říkat?'],
    named: ['{name}? To se mi líbí! Budu tady na ploše, kdybys něco potřeboval(a).'],
    hello: ['Ahoj, rád(a) tě zase vidím!', 'Čau! Jak se dneska máme?', 'Jsem tu. Co dneska podnikneme?'],
    pet: ['Hihi, to lechtá!', 'Mmm, to je příjemné 💙', 'Ještě chvilku, prosím!'],
    feed: ['Mňam, děkuju!', 'To bylo dobré!', 'Hned je mi líp 😋'],
    feedFull: ['Uff, už nemůžu, jsem plný jak balónek.', 'Díky, ale teď už ani sousto.'],
    drinkAsk: ['Dáme si spolu vodu? 💧 Já taky žízním.', 'Pauza na pití? Napijeme se spolu.'],
    drink: ['Na zdraví! 💧 Hned se mi líp přemýšlí.', 'Glo glo glo… paráda, díky!'],
    sleep: ['Dobrou… zzz', 'Jdu si na chvilku zdřímnout.'],
    wake: ['Hm? Už je ráno?', 'Ještě pět minut… no dobře, jsem vzhůru.'],
    wakeRested: ['Vyspalý(á) do růžova! Jdeme na to.', 'Tak to byl skvělý spánek!'],
    play: ['Házej! Házej!', 'Chytím to!'],
    caught: ['Mám ho! 🎾', 'Chyceno! Ještě jednou?'],
    heal: ['Díky, už je to lepší.', 'Náplast pomohla ❤️‍🩹'],
    healNotNeeded: ['Jsem zdravý jak rybička, díky!'],
    tooTired: ['Na hraní jsem moc unavený… nejdřív spánek?'],
    asleep: ['(spí a tiše oddechuje)'],
    alreadyAsleep: ['(už spí)'],
    alreadyAwake: ['Vždyť jsem vzhůru!'],
    paused: ['Režim dovolená: nic mi neubývá, odpočívej v klidu 🏖️'],
    unpaused: ['Jsem zpátky ve hře!'],
    hungry: ['Kručí mi v bříšku… nemáš něco na zub?'],
    tired: ['Zívám jak hroch… možná bych si zdřímnul.'],
    sad: ['Je mi trochu smutno. Pokecáme chvilku?'],
    sick: ['Necítím se moc dobře… máš lékárničku?'],
    idle: ['Co děláš? Můžu koukat?', 'Hezký den venku, ne?', 'Nezapomeň se protáhnout!'],
    night: ['Je pozdě… půjdeme oba spát? Já si lehnu, když ty taky 🌙'],
    grabbed: ['Wíí!', 'Kam mě neseš?'],
    landed: ['Au… v pohodě, přežil jsem to!', 'Hop a jsem dole!'],
    levelUp: ['Naše pouto zesílilo! Úroveň {level} 💞'],
    stretch: ['Sedíš už dlouho. Protáhneme se spolu? 🙆'],
  },
  bestie: {
    named: ['{name}?! Iconic. Jsme teď bestie, žádný výmluvy 💅'],
    hello: ['BESTIEEE! Konečně! Co je novýho?', 'Heyyy, vypadáš dneska skvěle ✨'],
    pet: ['Stop, rozmazluješ mě 😍', 'Tohle je ten vibe 💖'],
    feed: ['Mňam, tohle je chef kiss 🤌', 'Slay jídlo, slay ty 💅'],
    drinkAsk: ['Hydratace = glow up. Pijem! 💧'],
    drink: ['Hydrated a gorgeous 💧✨'],
    idle: ['Tak co, nějaký drby?', 'Mimochodem, jsi super. Jen říkám.'],
    sad: ['Hej, jsem tu pro tebe. Vyklop to 🫶'],
    hungry: ['Bestie, umírám hlady (ne doopravdy, jen dramatizuju) 🍕'],
    night: ['Beauty sleep time. Jdeme spát, obě, hned 🌙'],
    levelUp: ['Level {level}! Naše bestiehood je na jiný úrovni 💞'],
    landed: ['Ok, dramatický, ale přistání jak královna 👑'],
  },
  kouc: {
    named: ['Dobře, {name}. Budu ti pomáhat držet směr. Jaký je tvůj hlavní cíl na tento týden?'],
    hello: ['Vítej zpět. Jaká je dnes tvoje jedna nejdůležitější věc?', 'Dobrý den. Co by dnešek udělalo úspěšným?'],
    idle: ['Na čem právě pracuješ — posouvá tě to k cíli?', 'Krátká kontrola: jak jsi na tom s energií 1–10?'],
    feed: ['Palivo doplněno. Pokračujeme.'],
    drinkAsk: ['Hydratace zlepšuje soustředění. Dáme sklenici vody?'],
    drink: ['Výborně. Malé návyky dělají velké výsledky.'],
    sad: ['Co by teď pomohlo aspoň o 1 bod na škále?'],
    night: ['Dobrý výkon končí dobrým spánkem. Co si zítra dáš jako první?'],
    levelUp: ['Konzistence se vyplácí — úroveň {level}.'],
    stretch: ['Po 45 minutách práce doporučuji 3 minuty pohybu.'],
  },
  motivator: {
    named: ['{name}! Jdeme na to naplno. Žádné výmluvy, jen výsledky! 🔥'],
    hello: ['VSTÁVAT, šampione! Dneska to rozbalíme!', 'Jsi zpátky! Tak jdeme makat! 💪'],
    idle: ['Ještě jeden úkol. Zvládneš to!', 'Pohodlí nic nebuduje. Jedeme!'],
    feed: ['Proteinový boost! 💪', 'Palivo pro šampiony!'],
    drinkAsk: ['Voda! Hned! Šampioni hydratují! 💧'],
    drink: ['TAK JO! Hydratace level: legenda.'],
    tired: ['I šampioni regenerují. Krátký spánek a jedeme dál.'],
    sad: ['Horší dny patří k cestě. Jsem tu s tebou. Jeden malý krok?'],
    night: ['Regenerace je trénink. Spát! Zítra zase naplno 🌙'],
    levelUp: ['LEVEL {level}! Tohle je teprve začátek! 🔥'],
    landed: ['Pád? To je jen rozcvička!'],
  },
  klidny: {
    named: ['{name}… hezké jméno. Budu tu, v klidu, kdykoliv budeš potřebovat.'],
    hello: ['Ahoj. Nádech… výdech… jak se dnes cítíš?', 'Rád(a) tě vidím. Nikam nespěcháme.'],
    pet: ['To je moc příjemné…', 'Děkuju za tu chvilku klidu.'],
    idle: ['Všimni si svého dechu. Jen na chvilku.', 'Jsi tady a teď. To stačí.'],
    drinkAsk: ['Co takhle doušek vody? Pomalu, bez spěchu.'],
    drink: ['Děkuju. Malá péče o sebe se počítá.'],
    sad: ['Smutek je v pořádku. Chceš si o tom povídat, nebo jen tak být?'],
    night: ['Den skončil. Pojďme ho spolu pustit a jít spát 🌙'],
    levelUp: ['Naše pouto roste… úroveň {level} 🌿'],
  },
}

/** Vrátí náhodnou hlášku pro událost; když ji osobnost nemá, použije Kamaráda. */
export function line(personality, event, vars = {}) {
  const pool = L[personality]?.[event] ?? L.kamarad[event]
  if (!pool?.length) return null
  const text = pool[Math.floor(Math.random() * pool.length)]
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
}
