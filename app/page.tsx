import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "60px" }}>
      <h1>USC Find-a-Founder</h1>

      <p>
        Discover USC students who are building,
        exploring ideas, and looking for people to build with.
      </p>

      <Link href="/founders">
        Browse Founders
      </Link>
    </main>
  );
}