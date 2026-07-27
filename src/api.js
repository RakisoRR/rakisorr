import { supabase } from "./supabase.js";
import { hydrateIds } from "./defaults.js";

export async function fetchBookmarkTree(userId) {
  const { data: sections, error: secErr } = await supabase
    .from("sections")
    .select("id, name, sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (secErr) throw secErr;

  const { data: bookmarks, error: bmErr } = await supabase
    .from("bookmarks")
    .select("id, section_id, title, url, initials, sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (bmErr) throw bmErr;

  const bySection = new Map();
  for (const section of sections) {
    bySection.set(section.id, {
      id: section.id,
      name: section.name,
      items: [],
    });
  }

  for (const bm of bookmarks) {
    const section = bySection.get(bm.section_id);
    if (!section) continue;
    section.items.push({
      id: bm.id,
      title: bm.title,
      url: bm.url,
      initials: bm.initials || "",
    });
  }

  return {
    sections: sections.map((s) => bySection.get(s.id)).filter(Boolean),
  };
}

/** Replace the signed-in user's entire tree (last-write-wins). */
export async function replaceBookmarkTree(userId, tree) {
  const hydrated = hydrateIds(tree);

  const { error: delBmErr } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", userId);
  if (delBmErr) throw delBmErr;

  const { error: delSecErr } = await supabase
    .from("sections")
    .delete()
    .eq("user_id", userId);
  if (delSecErr) throw delSecErr;

  if (!hydrated.sections.length) {
    return hydrated;
  }

  const sectionRows = hydrated.sections.map((section, index) => ({
    id: section.id,
    user_id: userId,
    name: section.name,
    sort_order: index,
  }));

  const { error: insSecErr } = await supabase.from("sections").insert(sectionRows);
  if (insSecErr) throw insSecErr;

  const bookmarkRows = [];
  hydrated.sections.forEach((section) => {
    section.items.forEach((item, index) => {
      bookmarkRows.push({
        id: item.id,
        section_id: section.id,
        user_id: userId,
        title: item.title,
        url: item.url,
        initials: item.initials || "",
        sort_order: index,
      });
    });
  });

  if (bookmarkRows.length) {
    const { error: insBmErr } = await supabase.from("bookmarks").insert(bookmarkRows);
    if (insBmErr) throw insBmErr;
  }

  return hydrated;
}
