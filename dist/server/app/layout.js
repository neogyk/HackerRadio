// Built: 2026-03-01T18:55:24.820Z
//#region \0virtual:/Users/leonid/Desktop/LinkedinRadio/src/app/layout.tsx
function RootLayout({ children }) {
	return /* @__PURE__ */ React.createElement("div", {
		className: "min-h-screen text-gray-900",
		style: { backgroundColor: "rgb(255, 240, 194)" }
	}, /* @__PURE__ */ React.createElement("nav", { className: "border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-4xl mx-auto px-6 h-16 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("a", {
		href: "/",
		className: "flex items-center gap-3 no-underline"
	}, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("svg", {
		width: "20",
		height: "20",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "white",
		strokeWidth: "2.5",
		strokeLinecap: "round",
		strokeLinejoin: "round"
	}, /* @__PURE__ */ React.createElement("path", { d: "M9 18V5l12-2v13" }), /* @__PURE__ */ React.createElement("circle", {
		cx: "6",
		cy: "18",
		r: "3"
	}), /* @__PURE__ */ React.createElement("circle", {
		cx: "18",
		cy: "16",
		r: "3"
	}))), /* @__PURE__ */ React.createElement("span", { className: "text-xl font-bold text-gray-900" }, "HN Radio")))), /* @__PURE__ */ React.createElement("main", null, children));
}
const metadata = {
	title: "HN Radio - Listen to Hacker News",
	description: "Transform your Hacker News feed into an audio experience"
};

//#endregion
export { RootLayout as default, metadata };