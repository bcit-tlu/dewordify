import type { MarkoutMap } from "./types.js";

export const defaultStyleMap: string[] = [
	"comment-reference => span.word-comment",
	"p[style-name='heading 5'] => h5",
	"p[style-name='heading 6'] => h6",
	"p[style-name='heading 7'] => p:fresh > strong > em",
	"p[style-name='heading 8'] => p:fresh > strong",
	"p[style-name='heading 9'] => p:fresh > em",
	"r[style-name='Subtle Emphasis'] => em",
	"r[style-name='Emphasis'] => em",
	"r[style-name='Intense Emphasis'] => em",
	"r[style-name='Strong'] => strong",
	"r[style-name='Subtle Reference'] => cite",
	"r[style-name='Intense Reference'] => cite",
	"r[style-name='Book Title'] => cite",
	"r[style-name='Heading 1 Char'] => span.heading1",
	"r[style-name='Heading 1 Char Char'] => span.heading1",
	"r[style-name='Heading 1 Char Char Char'] => span.heading1",
	"r[style-name='Heading 2 Char'] => span.heading2",
	"r[style-name='Heading 2 Char Char'] => span.heading2",
	"r[style-name='Heading 2 Char Char Char'] => span.heading2",
	"r[style-name='Heading 3 Char'] => span.heading3",
	"r[style-name='Heading 3 Char Char'] => span.heading3",
	"r[style-name='Heading 3 Char Char Char'] => span.heading3",
	"r[style-name='Heading 4 Char'] => span.heading4",
	"r[style-name='Heading 4 Char Char'] => span.heading4",
	"r[style-name='Heading 4 Char Char Char'] => span.heading4",
	"r[style-name='Heading 5 Char'] => span.heading5",
	"r[style-name='Heading 5 Char Char'] => span.heading5",
	"r[style-name='Heading 5 Char Char Char'] => span.heading5",
	"r[style-name='Heading 6 Char'] => span.heading6",
	"r[style-name='Heading 6 Char Char'] => span.heading6",
	"r[style-name='Heading 6 Char Char Char'] => span.heading6",
	"r[style-name='Heading 7 Char'] => span.heading7",
	"r[style-name='Heading 7 Char Char'] => span.heading7",
	"r[style-name='Heading 7 Char Char Char'] => span.heading7"
];

export const defaultMarkoutMap: MarkoutMap = {
	start: "#",
	end: "/",
	wrappers: {
		"table": "<figure class='table'>",
		"audio": "<figure class='audio'>",
		"image": "<figure class='img'>",
		"video": "<figure class='video'>",
		"math": "<figure class='math'>",
		"quote": "<blockquote>",
		"reference": "<div class='reference'>",
		"definition": "<div class='definition'>",
		"example": "<div class='example'>",
		"key-point": "<div class='key-point'>",
		"link": "<div class='link'>",
		"note": "<div class='note'>",
		"warning": "<div class='warning'>",
		"assignment": "<div class='assignment'>",
		"quiz": "<div class='quiz'>",
		"activity": "<div class='activity'>",
		"case": "<div class='case'>",
		"discussion": "<div class='discussion'>",
		"group-activity": "<div class='group-activity'>",
		"outcome": "<div class='outcome'>",
		"reading": "<div class='reading'>",
		"reflection": "<div class='reflection'>",
		"review": "<div class='review'>",
		"accordion": "<div class='accordion'>",
		"tabs": "<div class='tabs'>",
		"reveal": "<div class='reveal' data-button='Reveal'>",
		"knowledge-check": "<div class='knowledge-check'>",
		"swapper": "<div class='swapper'>",
		"html-comment": "<div class='html-comment'>",
		"checklist": "<div class='checklist'>",
		"slider": "<div class='slider'>",
		"line-matching": "<div class='line-matching'>",
		"flashcards": "<figure class='flashcards'>",
		"doing": "<div class='doing'>",
		"knowing": "<div class='knowing'>",
		"interaction": "<pre class='interaction'>"
	},
	mappings: {
		"tables": "table",
		"images": "image",
		"videos": "video",
		"quotes": "quote",
		"ref": "reference",
		"references": "reference",
		"definitions": "definition",
		"examples": "example",
		"key-points": "key-point",
		"keypoint": "key-point",
		"keypoints": "key-point",
		"links": "link",
		"notes": "note",
		"warnings": "warning",
		"assignments": "assignment",
		"quizes": "quiz",
		"activities": "activity",
		"cases": "case",
		"discussions": "discussion",
		"group-activities": "group-activity",
		"groupactivity": "group-activity",
		"groupactivities": "group-activity",
		"outcomes": "outcome",
		"readings": "reading",
		"reflections": "reflection",
		"reviews": "review",
		"accordions": "accordion",
		"tabs": "tabs",
		"tab": "tabs",
		"tabbed": "tabs",
		"tabbeds": "tabs",
		"reveals": "reveal",
		"active-reveal": "reveal",
		"activereveal": "reveal",
		"active-reveals": "reveal",
		"activereveals": "reveal",
		"knowledge-checks": "knowledge-check",
		"knowledgecheck": "knowledge-check",
		"knowledgechecks": "knowledge-check",
		"self-test": "knowledge-check",
		"self-tests": "knowledge-check",
		"selftest": "knowledge-check",
		"selftests": "knowledge-check",
		"swappers": "swapper",
		"swap": "swapper",
		"swaper": "swapper",
		"swapers": "swapper",
		"interactions": "interaction",
		"interactive": "interaction",
		"interactivity": "interaction",
		"check-list": "checklist",
		"check-lists": "checklist",
		"checklists": "checklist",
		"slider": "slider",
		"sliders": "slider",
		"imageslider": "slider",
		"imagesliders": "slider",
		"image-slider": "slider",
		"image-sliders": "slider",
		"imagesslider": "slider",
		"imagessliders": "slider",
		"images-slider": "slider",
		"images-sliders": "slider",
		"line-matchings": "line-matching",
		"lines-matching": "line-matching",
		"lines-matchings": "line-matching",
		"linematchings": "line-matching",
		"linesmatching": "line-matching",
		"linesmatchings": "line-matching",
		"doing": "doing",
		"knowing": "knowing",
		"flashcard": "flashcards",
		"flash-cards": "flashcards",
		"flash-card": "flashcards"
	}
};

export const defaultTemplate = `<!DOCTYPE html>
<html lang="en" class="no-js">

<head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=yes" />
    <meta name="robots" content="noindex,nofollow,noarchive,nosnippet" />
    <title>{{title}}</title>
    <link rel="stylesheet" href="https://sugar-suite.ltc.bcit.ca/css/bcit.css">
    <script src="https://sugar-suite.ltc.bcit.ca/js/vendor/modernizr.js"></script>
</head>

<body>
    <div class="container">
        {{content}}
    </div>
    <script src="https://sugar-suite.ltc.bcit.ca/js/lat.js"></script>
</body>

</html>
`;
