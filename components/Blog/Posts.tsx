import Link from "next/link";

export default function BlogPosts(props: any) {
  const posts = props.posts;
  const listItems = posts.map((post: any, index: any) => (
    <Link href={`/${post.url}`} key={index}>
      <a
        href={`/${post.url}`}
        tabIndex={0}
        className="p-2 md:w-1/3 cursor-pointer group"
      >
        <div className="h-full  bg-bg-300 rounded-md overflow-hidden">
          <div className="p-3 bg-bg-500 group-hover:bg-gradient">
            <div className="font-bold">#{post.keyword}</div>
          </div>
          <div className="p-3 border-t-2 border-bg-700 group-hover:text-white">
            <p>{post.description}</p>
          </div>
        </div>
      </a>
    </Link>
  ));
  return (
    <section className="bg-bg-700 body-font max-w-screen-lg container">
      <h3
        className="text-center mt-8 mb-6 capitalize text-xl font-bold"
        id={props.title ? props.title : "related"}
      >
        {props.title ? props.title : "Related articles"}
      </h3>
      <div className="container py-6 mx-auto">
        <div className="flex flex-wrap m-4">{listItems}</div>
      </div>
    </section>
  );
}