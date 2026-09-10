# Display faces

The display faces in this folder are borrowed from the Typecase library
(`../../../typecase/fonts`), which keeps them for personal comparison. Every one
of them is a **demo or personal-use cut**. They are here so the typeface
pairings in `src/content/typeface.js` can be tried on the real UI; they are not
cleared for a public deployment of Joseki.

## What the build actually loads

Two of them. `src/styles/fontfaces.js` declares a face for
these and for nothing else, so nothing else is imported and nothing else is
bundled.

| File | Family | Vendor | Terms | Worn by |
| --- | --- | --- | --- | --- |
| Welorac-Regular.otf | Welorac | Ermedia Studio | Demo. Personal use only. | `kaya`, headings |
| Qliesya-Regular.otf | Qliesya | Ermedia Studio | Demo. Personal use only. | `vitrine`, headings |

Both display cuts are headings only. No pairing puts a borrowed face into running
text any more, and no pairing uses a script anywhere — the set that did was cut
back to `house`, `kaya` and `vitrine`.

## Still in the folder, worn by nothing

Left here rather than deleted, because a pairing may want one again. Nothing
imports them, so they cost the build nothing where they sit.

| File | Family | Vendor | Terms |
| --- | --- | --- | --- |
| Bellique-Regular.otf | Bellique | Shanaf Studio | Personal use (check vendor). |
| MaisonGalliard-Serif.otf | Maison Galliard | Creacy Studio Co. | Demo. Personal use only. |
| MaisonGalliard-Script.otf | Maison Galliard | Creacy Studio Co. | Demo. Personal use only. |
| MaisonGalliard-Sans.otf | Maison Galliard | Creacy Studio Co. | Demo. Personal use only. |
| Kuigaf-Regular.otf | Kuigaf | Yumnacreative, Dhabee Studio | Personal use (check vendor). |
| Raventhorn-Regular.otf | Raventhorn | Cikareotype Studio | Personal use (check vendor). |
| Ronalltie-Regular.ttf | Ronalltie | DM Letter Studio | Personal / demo use only. |
| Further-Regular.otf | Further | Pian45 Studio | Personal use (check vendor). |
| CocogoosePro-Thin.ttf | Cocogoose Pro | Zetafonts | Trial. Personal use only. |
| CocogoosePro-LightItalic.ttf | Cocogoose Pro | Zetafonts | Trial. Personal use only. |

Before Joseki ships publicly, the two faces in the first table need either a
purchased desktop-plus-web licence from the vendor above, or a substitute under
the OFL. `house` (Fraunces, Hanken Grotesk) and every Google body family the set
uses (Instrument Sans, Newsreader, Courier Prime) are OFL already, so the default
build — and every pairing's body text — is clear as it stands.
