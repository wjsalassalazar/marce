import {
  useInfiniteFeedQuery,
  useUserPostsQuery,
  useUserQuery
} from "@/hooks/query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

const useHome = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";

  const showcasedPostId = router.query.postId
    ? String(router.query.postId)
    : undefined;
  const sort = router.query.sort as string | undefined;
  const time = router.query.time as string | undefined;

  const closeShowcasedPost = () => {
    const { postId, ...restParams } = router.query;
    router.push(
      {
        pathname: "/",
        query: { ...restParams }
      },
      undefined,
      {
        shallow: true,
        scroll: false
      }
    );
  };

  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isSuccess
  } = useInfiniteFeedQuery({
    sort,
    time
  });

  const { data: userData } = useUserPostsQuery(currentUserId);

  const { data: userProfileData } = useUserQuery(currentUserId);

  const isCurrentUserProfileOwner = currentUserId === userProfileData?.id;

  let allPosts = [
    ...(feedData?.pages.flatMap((page) => page.posts) ?? []),
    ...(userData?.pages.flatMap((page) => page.posts) ?? [])
  ];

  // Filtrar las publicaciones por tiempo
  if (time === "week") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7); // Obtener la fecha hace una semana
    allPosts = allPosts.filter((post) => new Date(post.createdAt) > weekAgo);
  } else if (time === "day") {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Establecer la hora a 00:00:00
    allPosts = allPosts.filter((post) => new Date(post.createdAt) > today);
  }

  // Ordenar las publicaciones por fecha
  allPosts = allPosts.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Orden descendente, cambiar a dateA - dateB para orden ascendente
  });

  const isPostsNotExists = isSuccess && !allPosts.length;

  return {
    isPostsNotExists,
    showcasedPostId,
    closeShowcasedPost,
    data: {
      pages: [{ posts: allPosts }],
      pageParams: [] // Agrega una propiedad pageParams con un valor predeterminado aquí
    },
    fetchNextPage,
    hasNextPage,
    isSuccess,
    isCurrentUserProfileOwner
  };
};

export default useHome;
