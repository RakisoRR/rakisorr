/** Embedded defaults — seeded into Supabase on first login when the cloud tree is empty. */
export const DEFAULT_BOOKMARKS = {
  sections: [
    {
      name: "Essentials",
      items: [
        { title: "WhatsApp", url: "https://web.whatsapp.com/", initials: "WA" },
        { title: "TickTick", url: "https://ticktick.com/webapp", initials: "TT" },
        { title: "Mail", url: "https://mail.google.com/mail/u/1/#inbox", initials: "GM" },
        { title: "Calendar", url: "https://calendar.google.com/calendar/u/0/r", initials: "GC" },
        { title: "Moodle", url: "https://estudijas.rcmc.lv/my/", initials: "Mo" },
        { title: "RCMC Schedule", url: "https://docs.google.com/spreadsheets/d/1GeRD0aCphKXZEywLJZirqP8gGHzqxLSkCZW9rWNUAoc/edit?gid=325603477#gid=325603477", initials: "RS" },
      ],
    },
    {
      name: "Office",
      items: [
        { title: "Notion", url: "https://www.notion.so", initials: "N" },
        { title: "Drive", url: "https://drive.google.com/drive/u/3/", initials: "GD" },
        { title: "OneDrive", url: "https://onedrive.live.com/", initials: "OD" },
        { title: "Keep", url: "https://keep.google.com/u/0/#label/Quotes", initials: "K" },
        { title: "Whimsical", url: "https://whimsical.com/", initials: "W" },
        { title: "Raindrop.io", url: "https://app.raindrop.io/my/38221770", initials: "RD" },
      ],
    },
    {
      name: "AI",
      items: [
        { title: "ChatGPT", url: "https://chat.openai.com", initials: "CG" },
        { title: "Gemini", url: "https://gemini.google.com/app", initials: "Ge" },
        { title: "NotebookLM", url: "https://notebooklm.google.com/", initials: "NL" },
        { title: "OpenRouter", url: "https://openrouter.ai/", initials: "OR" },
      ],
    },
    {
      name: "Research",
      items: [
        { title: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/", initials: "PM" },
        { title: "Biblioteca UMFCD", url: "http://ezproxy.medgrid.eu/menu", initials: "UM" },
        { title: "ResearchRabbit AI", url: "https://app.researchrabbit.ai/", initials: "RR" },
        { title: "Rayyan", url: "https://new.rayyan.ai/reviews", initials: "RY" },
        { title: "SciSpace AI", url: "https://scispace.com/", initials: "SS" },
        { title: "Elicit AI", url: "https://elicit.com/", initials: "EL" },
        { title: "Consensus", url: "https://consensus.app/", initials: "CS" },
      ],
    },
    {
      name: "Media",
      items: [
        { title: "YouTube", url: "https://www.youtube.com/", initials: "YT" },
        { title: "Plex", url: "https://app.plex.tv/", initials: "P" },
        { title: "Netflix", url: "https://www.netflix.com/browse", initials: "NF" },
      ],
    },
    {
      name: "Tools & Shopping",
      items: [
        { title: "Tinkercad", url: "https://www.tinkercad.com/dashboard", initials: "TK" },
        { title: "MakerWorld", url: "https://makerworld.com/", initials: "MW" },
        { title: "Printables", url: "https://www.printables.com/", initials: "Pr" },
        { title: "Gumroad", url: "https://gumroad.com/", initials: "GR" },
        { title: "gg.deals", url: "https://gg.deals/", initials: "gD" },
        { title: "Hornbach", url: "https://www.hornbach.ro/", initials: "HB" },
        { title: "Open-Slum", url: "https://open-slum.org/", initials: "OS" },
      ],
    },
  ],
};

export function cloneDefaults() {
  return structuredClone(DEFAULT_BOOKMARKS);
}

export function hydrateIds(tree) {
  const next = structuredClone(tree);
  next.sections = (next.sections || []).map((section) => ({
    id: section.id || crypto.randomUUID(),
    name: section.name,
    items: (section.items || []).map((item) => ({
      id: item.id || crypto.randomUUID(),
      title: item.title,
      url: item.url,
      initials: item.initials || "",
    })),
  }));
  return next;
}
