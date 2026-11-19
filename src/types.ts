export type Story = {
  id: string; slug: string; title: string; subtitle: string; subject_name: string;
  category: string; cover_image: string; excerpt: string; published_at?: string | null;
  status: 'draft' | 'published'; featured: boolean; body?: string;
}
