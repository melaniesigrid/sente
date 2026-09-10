# Display faces

Daenerys is the exception in this folder: it is not a display face and belongs to
no pairing. It sets one thing, the signature in the footer, and it is the face
that most needs buying before Joseki is public, because the demo forbids
commercial use outright.

The display faces in this folder are borrowed from the Typecase library
(`../../../typecase/fonts`), which keeps them for personal comparison. Every one
of them is a **demo or personal-use cut**. They are here so the typeface
pairings in `src/content/typeface.js` can be tried on the real UI; they are not
cleared for a public deployment of Joseki.

| File | Family | Vendor | Terms |
| --- | --- | --- | --- |
| Welorac-Regular.otf | Welorac | Ermedia Studio | Demo. Personal use only. |
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
| Qliesya-Regular.otf | Qliesya | Ermedia Studio | Demo. Personal use only. |
| Daenerys-Regular.otf | Daenerys | Faptype | Demo. Personal use only. No commercial use. |

Before Joseki ships publicly, each pairing you want to keep needs either a
purchased desktop-plus-web licence from the vendor above, or a substitute under
the OFL. The `house` pairing (Fraunces, Hanken Grotesk) and the body faces used
by the other pairings (Instrument Sans, Newsreader) are all OFL already, so the
default build is clear as it stands.

`galliard` is the exception on the body side: it sets its body and caption text
in Maison Galliard Sans, so that pairing puts a personal-use cut into running
text and not only into headings. It is also a single weight — the browser
synthesises its bold.
