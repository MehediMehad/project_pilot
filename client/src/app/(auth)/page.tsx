import Link from "next/link";

const page = () => {
  return (
    <div className="flex flex-col">
      <Link href="/login">Login</Link>
      <Link href="/register">Register</Link>
      <Link href="/dashboard">Dashboard</Link>
    </div>
  );
};

export default page;
