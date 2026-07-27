/** Embedded defaults — seeded into Supabase on first login when the cloud tree is empty. */
export const DEFAULT_BOOKMARKS = {
  sections: [
    {
      name: "Essentials",
      items: [
        { title: "WhatsApp", url: "https://web.whatsapp.com/", initials: "WA" },
        { title: "Mail", url: "https://mail.google.com/mail/u/1/#inbox", initials: "GM" },
        { title: "Calendar", url: "https://calendar.google.com/calendar/u/0/r", initials: "GC" },
        { title: "YouTube", url: "https://www.youtube.com/", initials: "YT" },
        { title: "Netflix", url: "https://www.netflix.com/browse", initials: "NF" },
      ],
    },
    {
      name: "Office",
      items: [
        { title: "Notion", url: "https://www.notion.so", initials: "N" },
        { title: "Drive", url: "https://drive.google.com/drive/u/3/", initials: "GD" },
        { title: "OneDrive", url: "https://onedrive.live.com/", initials: "OD" },
      ],
    },
    {
      name: "AI",
      items: [
        { title: "ChatGPT", url: "https://chat.openai.com", initials: "CG" },
        { title: "Gemini", url: "https://gemini.google.com/app", initials: "Ge" },
        { title: "NotebookLM", url: "https://notebooklm.google.com/", initials: "NL" },
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
