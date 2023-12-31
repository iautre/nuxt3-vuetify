import type { RouterConfig } from "@nuxt/schema";
export default <RouterConfig>{
    routes: (_routes) => [
        {
            name: "index",
            path: "/",
            component: () => import("~/pages/page.vue"),
        },
        {
            name: "indexPage",
            path: "/page/:page",
            component: () => import("~/pages/page.vue"),
        },
        {
            name: "post",
            path: "/:cid.html",
            props: {pageType: 'post'},
            component: () => import("~/pages/post.vue"),
        },
        {
            name: "page",
            path: "/:slug",
            props: {pageType: 'page'},
            component: () => import("~/pages/post.vue"),
        },
        {
            name: "shuoshuo",
            path: "/shuoshuo",
            component: () => import("~/pages/shuoshuo.vue"),
        },
    ],
};
