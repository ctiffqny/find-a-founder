import { getFounders } from "@/lib/airtable";
import FounderDirectory from "@/components/FounderDirectory";

export default async function FoundersPage() {
  const founders = await getFounders();

  return (
    <main className="founders-page">
      <div className="founders-header">
        <h1>Find a Founder</h1>

        <p>
          Discover USC students who are building,
          exploring ideas, and looking for people to
          build with.
        </p>
      </div>

      <FounderDirectory founders={founders} />
    </main>
  );
}