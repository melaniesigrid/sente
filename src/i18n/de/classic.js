// de · classic
/* Der Klassiker des Weiqi in dreizehn Kapiteln, auf Deutsch.

   Dies sind deutsche Fassungen von Josekis englischen Fassungen des Textes von
   Zhang Ni, und die Quellenzeile sagt es in jeder Sprache: es sind keine Zitate
   aus irgendeiner veröffentlichten Übersetzung, in keiner Sprache.

   Was nicht übersetzt wird: der Name des Verfassers, der der Dynastie und die
   zweiunddreißig umschriebenen Namen selbst — chong, fei, guan, zheng. Kapitel
   elf handelt von diesen Namen und endet mit dem Argument, sie müssten
   richtiggestellt werden, ehe die Formen sich sehen lassen. Sie zu ersetzen
   wäre die einzige Änderung, die das Kapitel selbst verbietet. Ihre
   Erläuterungen und ihre modernen Entsprechungen sind übersetzt, denn das sind
   Beschreibungen. */

export const classicBook = {
  title: "Der Klassiker in dreizehn Kapiteln",
  short: "Der Klassiker des Weiqi",
  era: "Song-Dynastie, elftes Jahrhundert",
  blurb: "Die älteste Abhandlung über das Spiel, eine Lektion je Kapitel. Zhang Ni schrieb für Beamte, die spielten, wie sie regierten: zähl, bevor du dich festlegst, kenn deine eigene schwache Stelle, nimm zuerst die Ecken, und prahl nicht mit einem Sieg.",
  credit: "Die Sprüche sind Josekis Fassungen des Textes aus dem elften Jahrhundert, keine Zitate einer Übersetzung.",
};

export const preface = {
  title: "Vorwort",
  plain: "Vor zweitausend Jahren teilte man die Spieler schon in drei Arten: den, der das ganze Brett sieht und umschließt, den, der gut kämpft und zählen muss, um zu wissen, wo er steht, und den, der sich in eine Ecke verkriecht und klein lebt. Die dreizehn Kapitel handeln vom Weg vom dritten zum ersten.",
  text: {
    0: "Die Gespräche stellen eine schroffe Frage. Wer sich den ganzen Tag satt isst und seinen Geist auf nichts richtet, ist übel dran. Gibt es denn keine Weiqi-Spieler? Selbst das wäre besser, als müßig zu sitzen.",
    1: "Huan Tan, der unter den Han schrieb, nannte das Spiel ein kleines Abbild des Krieges und teilte die Spieler in drei. Der kundige Spieler versteht die ganze Gestalt und setzt die Steine so, dass sie umschließen. Der mittlere Spieler zielt auf Vorteile und bringt es fertig, den Gegner abzuschneiden, sodass er, ob er gewinnt oder verliert, aufmerksam bleiben und sorgfältig zählen muss, um dessen sicher zu sein. Der unerfahrene Spieler verteidigt die Seiten und Ecken, bewegt sich in kleinen Bezirken und gibt sich damit zufrieden, auf einem Stück Boden zu überleben.",
    2: "Jedes Zeitalter seither hatte alle drei Arten von Spielern, und darum ist der Weg des Spiels nie erschöpft. Was folgt, nimmt die Fragen, die über Sieg und Niederlage entscheiden, und teilt sie in dreizehn Kapitel. Zeilen aus den alten Kriegsschriften sind eingefügt, wo sie passen.",
  },
};

export const kind = {
  inexpert: { name: "Der unerfahrene Spieler", text: "Verteidigt die Seiten und Ecken, spielt in kleinen Bezirken und gibt sich mit einem kleinen Leben zufrieden." },
  average: { name: "Der mittlere Spieler", text: "Spielt auf Vorteile und schneidet den Gegner auseinander und muss darum aufmerksam bleiben und zählen, um zu wissen, wo er steht." },
  skillful: { name: "Der kundige Spieler", text: "Sieht die ganze Gestalt und setzt die Steine so, dass sie umschließen." },
};

export const level = {
  1: { name: "Im Geist sein", text: "Nichts wird ausgerechnet, weil nichts ausgerechnet werden muss. Der Zug ist einfach da." },
  2: { name: "In der Erleuchtung sitzen", text: "Still sitzen und es ganz sehen, ohne es Schritt für Schritt durchzugehen." },
  3: { name: "Das Ganze halten", text: "Das ganze Brett ist eine Sache im Kopf, nicht eine Reihe getrennter Kämpfe." },
  4: { name: "Die Wandlungen durchschauen", text: "Die Varianten sind durchsichtig. Was aus einer Form wird, ist schon zu sehen." },
  5: { name: "Weisheit anwenden", text: "Das Urteil ist verlässlich, und es wird mit Absicht angewandt, statt durch Glück gefunden zu werden." },
  6: { name: "Kleine Kunst", text: "Echtes Können, auf engem Raum gut gebraucht, ohne die Partie schon zu beherrschen." },
  7: { name: "Mit Kraft kämpfen", text: "Die Stärke entscheidet die Partie. Was sich nicht lesen lässt, wird stattdessen durchgedrückt." },
  8: { name: "Ungeschickt wirken", text: "Tüchtig, und sich bewusst, wie viel noch ungeschickt ist. Das Kapitel ist hier nicht freundlich." },
  9: { name: "Bei der Unbeholfenheit bleiben", text: "Die unterste Stufe, die der Klassiker noch zählt. Alles darunter zu nummerieren lehnt er ab." },
};

export const belowTheLevels = "Stufen unterhalb dieser lassen sich nicht sinnvoll zählen, und da sie nicht auf die Liste gehören, werden sie hier nicht behandelt.";

export const chapter = {
  1: {
    title: "Das Brett und die Steine",
    theme: "Was das Brett ist, und warum sich keine Partie wiederholt.",
    plain: "Das Brett ändert sich nie und die Steine hören nie auf, sich zu bewegen, und keine zwei Partien sind je denselben Weg gegangen. Nichts hier lässt sich auswendig lernen. Es muss jedes Mal neu erarbeitet werden.",
    text: {
      0: "Die zehntausend Dinge zählen von der Eins an, und so haben auch die dreihundertsechzig Schnittpunkte ihre Eins: den Punkt in der Mitte, von dem aus die vier Richtungen ausgelegt sind.",
      1: "Dreihundertsechzig ist die Zahl der Tage eines Jahres. In vier Ecken geteilt, wie sich ein Jahr in Jahreszeiten teilt, sind das neunzig Punkte je Ecke, einer für jeden Tag einer Jahreszeit. Zweiundsiebzig Punkte liegen an den Rändern, einer für jede Fünftagewoche, die der alte Kalender hielt. Die dreihundertsechzig Steine teilen sich gleichmäßig auf Schwarz und Weiß, nach den beiden Prinzipien. Das Brett ist viereckig und still. Die Steine sind rund und bewegen sich.",
      2: "Seit alter Zeit hat kein Spieler die Steine je genau so gesetzt, wie sie in einer früheren Partie gefallen waren. Jeder Tag ist neu. Das Denken muss also tief gehen und das Lesen genau sein, und du musst zu verstehen suchen, was einen Sieg oder eine Niederlage wirklich hervorbringt. Nur so erreichst du, was du noch nicht erreicht hast.",
    },
    sayings: {
      0: "Das Brett ist viereckig und still. Die Steine sind rund und bewegen sich.",
      1: "Dreihundertsechzig Punkte, und einer in der Mitte, aus dem sie alle kommen.",
      2: "Keine zwei Partien waren je dieselbe. Jeder Tag ist neu.",
    },
  },
  2: {
    title: "Vom Rechnen",
    theme: "Zählen ist der ganze Unterschied zwischen einem Plan und einer Hoffnung.",
    plain: "Zählen ist der ganze Unterschied zwischen einem Plan und einer Hoffnung. Kannst du sagen, wer führt, während die Partie noch läuft, dann rechnest du. Kannst du es nicht, dann rätst du.",
    text: {
      0: "Der Spieler, dessen Formen richtig sind, hat Macht über den anderen. Ordne also zuerst den Plan im Innern, dann kommen die Formen draußen ganz heraus.",
      1: "Kannst du ausmachen, wer gewinnt, während die Partie noch gespielt wird, hast du gut gerechnet. Kannst du es nicht ausmachen, hast du schlecht gerechnet. Weißt du selbst nach dem Zählen der Steine nicht, wer gewonnen hat, dann hast du überhaupt nicht gerechnet.",
      2: "Die Kriegsschrift sagt es schlicht: wer viel rechnet, gewinnt, wer wenig rechnet, verliert. Und was ist mit dem, der gar nicht rechnet? Alles muss gezählt werden, sonst sieht man Sieg und Niederlage nicht kommen.",
    },
    sayings: {
      0: "Wer am meisten rechnet, gewinnt. Wer am wenigsten rechnet, verliert. Und was ist mit dem, der gar nicht rechnet?",
      1: "Kannst du sagen, wer führt, während die Partie noch läuft, hast du gut gezählt.",
      2: "Ordne den Plan im Innern, bevor die Form draußen fertig ist.",
    },
  },
  3: {
    title: "Vom Halten des Gebiets",
    theme: "Erst die Ecken, dann Erweiterungen, gemessen an den Steinen dahinter.",
    plain: "Fang in den Ecken an, wo der Boden am billigsten ist, und erweitere dann an den Seiten entlang so weit, wie die Steine hinter dir tragen können. Ein Stein reicht zwei Punkte, zwei Steine drei, drei reichen vier.",
    text: {
      0: "Gebiet halten heißt, die groben Linien der Partie zu ziehen, während die Steine noch gesetzt werden. Zu Beginn verteilen sich die Stellungen auf die vier Ecken. Dann beginnt das Spiel, und die Steine gehen schräg hinaus, überspringen zwei Punkte und fallen einen darunter.",
      1: "Von zwei Steinen, die zusammenstehen, darfst du drei Punkte überspringen. Von dreien vier. Fünf ist möglich, wenn du zu einer anderen Stellung hinüberreichen willst, aber Nähe ist nicht Berührung, und die Entfernung darf nicht zu groß sein.",
      2: "Die Alten haben das alles durchgestritten, und ihre Nachfolger haben die Regeln studiert, die daraus wurden. Wer sie nicht annehmen will und stattdessen seine eigene Methode möchte, kann nicht wissen, was dabei herauskommt. Ohne guten Anfang kein gutes Ende.",
    },
    sayings: {
      0: "Nimm zuerst die Ecken. Dann erweitere: zwei Punkte von einem Stein, drei von zweien, vier von dreien.",
      1: "Nah ist nicht berührend. Weit ist nicht außer Reichweite.",
      2: "Ohne guten Anfang kein gutes Ende.",
    },
  },
  4: {
    title: "Vom Eintritt in den Kampf",
    theme: "Opfer, Initiative, und ein Blick zur anderen Seite, ehe du zuschlägst.",
    plain: "Steine sind billig und die Initiative ist es nicht. Lass die Steine ziehen, die schon gefangen sind, behalte den Zug, und sieh auf die ferne Seite des Bretts, bevor du auf der nahen zuschlägst.",
    text: {
      0: "Auf dem Weg dieses Spiels sei sorgfältig und sei genau. Am Ende hält der kundige Spieler die Mitte, der unerfahrene die Seiten, und der mittlere findet sich in den Ecken wieder. So war die Ordnung von jeher.",
      1: "Viele Steine dürfen verloren gehen, solange die Initiative es nicht tut, denn die Initiative zu verlieren heißt, sie jemandem zu geben, der sie nicht hatte. Bevor du nach links schlägst, sieh nach rechts. Bevor du hinter die Linien des Gegners gehst, sieh, was vor ihnen steht. Ein fernes Heer tut, als wäre es nah; ein nahes tut, als wäre es fern.",
      2: "Es gibt keinen Grund, zwei lebende Gruppen zu trennen, denn beide leben, ob sie sich verbinden oder nicht, und keinen Sinn darin, zwei tote verbinden zu wollen. Statt gefährdete Steine am Atmen zu halten, lass sie ziehen und nimm neuen Boden. Wo der Gegner viele Steine hat und du wenige, denk zuerst an dein eigenes Überleben. Wo du viele hast und er sich müht, nutze es und erweitere.",
      3: "Der beste Sieg ist der ohne Kampf gewonnene, und die beste Stellung die, die keinen Kampf herausfordert. Eröffne nach den Regeln; gewinne mit Vorstellungskraft. Verteidigt der Gegner und tut nichts, so hat er vor anzugreifen. Lässt er kleine Gegenden in Ruhe, so plant er dort etwas Großes. Ein Spieler, der Steine irgendwohin setzt, hat keinen Plan, und ein Spieler, der nur antwortet, geht schon auf die Niederlage zu.",
    },
    sayings: {
      0: "Bevor du nach links schlägst, sieh nach rechts.",
      1: "Statt Steine zu pflegen, die schon in Gefahr sind, lass sie ziehen und nimm neuen Boden.",
      2: "Steine zu verlieren lässt sich ertragen. Die Initiative zu verlieren nicht.",
      3: "Eröffne nach den Regeln. Gewinne mit Vorstellungskraft.",
      4: "Der Spieler, der nur antwortet, geht schon auf die Niederlage zu.",
      5: "Der beste Sieg ist der ohne Kampf gewonnene.",
    },
  },
  5: {
    title: "Von Leere und Fülle",
    theme: "Wo die Steine dicht stehen, geh nicht hin. Wo sie dünn sind, geh.",
    plain: "Drück nicht gegen Stärke. Wo dein Gegner dick ist, bleib draußen; wo er dünn ist, geh hinein. Und ändere den Plan, wenn sich das Brett ändert, denn das Brett ändert sich immer.",
    text: {
      0: "Folge zu vielen Plänen auf einmal, und deine Formen fallen auseinander. Sind sie erst gebrochen, ist es schwer, nicht unterzugehen.",
      1: "Spiel deine Steine nicht hart gegen die des Gegners. Tu das, und du füllst ihn, während du dich selbst leerst. Was leer ist, lässt sich leicht betreten; was voll ist, lässt sich schwer überwältigen. Ein Heer nimmt die Gestalt des Wassers an, das von den Höhen abläuft und hinunterfließt: meide, was schon voll ist, und fließe in die Leere.",
      2: "Halt nicht an einem Plan fest. Ändere ihn mit dem Augenblick. Siehst du, dass du vorrücken kannst, rück vor. Triffst du auf Schwierigkeiten, zieh dich zurück. Greif etwas und weigere dich, die Methode zu ändern, und am Ende hast du nur dieses eine Ding gegriffen.",
    },
    sayings: {
      0: "Spiel zu nah an deinem Gegner, und du füllst ihn, während du dich selbst leerst.",
      1: "Volles ist schwer zu brechen. Leeres ist leicht zu betreten.",
      2: "Meide, was schon voll ist. Fließe in die Leere.",
      3: "Halt nicht an einem Plan fest. Ändere ihn mit dem Augenblick.",
      4: "Siehst du, dass du vorrücken kannst, rück vor. Triffst du auf Schwierigkeiten, zieh dich zurück.",
    },
  },
  6: {
    title: "Vom Sich-selbst-Kennen",
    theme: "Deine eigene schwache Stelle ist die, auf die der Gegner zukommt.",
    plain: "Finde zuerst deine eigene schwächste Stelle, denn dorthin ist dein Gegner schon unterwegs. Zu wissen, wann man einen Kampf ausschlägt, gewinnt so viele Partien wie das Gewinnen eines Kampfes.",
    text: {
      0: "Die Weisen sehen, was noch nicht erschienen ist. Die Törichten sind blind, obwohl der Beweis vor ihnen liegt.",
      1: "Kenn deine eigenen schwachen Stellen, und du kannst sagen, was deinem Gegner nützen würde, und gewinnst. Du gewinnst, wenn du weißt, wann zu kämpfen und wann abzulehnen ist. Wenn du ermessen kannst, wie hart zu drücken ist. Wenn deine eigene Vorbereitung ihn daran hindert, vorbereitet zu sein. Wenn du ihn durch Ruhen erschöpfst und durch Nichtkämpfen zu Fall bringst.",
      2: "Wer sich selbst kennt, ist erleuchtet.",
    },
    sayings: {
      0: "Kenn deine eigenen schwachen Stellen, und du weißt, wo dein Gegner kommen wird.",
      1: "Wisse, wann zu kämpfen und wann abzulehnen ist, und du wirst gewinnen.",
      2: "Wer sich selbst kennt, ist erleuchtet.",
      3: "Ruh dich aus, und lass die andere Seite sich selbst erschöpfen.",
    },
  },
  7: {
    title: "Vom Lesen der Partie",
    theme: "In Führung halte deine Form. Im Rückstand geh hinein. Füttere nie eine tote Gruppe.",
    plain: "Spiel nach dem Stand. In Führung halte alles solide und einfach. Im Rückstand geh in das größte Land, das du noch nehmen kannst. Steine, die einer schon toten Gruppe zugefügt werden, machen den Verlust nur größer.",
    text: {
      0: "Die Formen, die die Steine annehmen, müssen zusammenhalten. Ergreif die Initiative und behalte sie, Zug um Zug, vom ersten Stein bis zum letzten.",
      1: "Kannst du der Stellung nicht ansehen, wer von euch stärker steht, so sieh auf die kleinsten Einzelheiten. Siehst du, dass du gewinnst, so halte deine Form zusammen. Siehst du, dass du verlierst, so geh in die größeren Gebiete. Wenn dir das Vorrücken an der Seite nur das Überleben einbringt, bist du geschlagen. Je weniger du nachgibst, während du in Bedrängnis bist, desto schlimmer wird der Verlust: ein verzweifelter Kampf um Verlorenes verliert mehr.",
      2: "Wo zwei Stellungen einander umschließen, drück zuerst von außen. Wo nichts von dir in der Nähe steht und die Steine schlecht liegen, füg keine weiteren hinzu. Hat der Gegner schon in eine Stellung von dir eingebrochen, so ist dort zu spielen ein Setzen von Steinen, ohne sie zu setzen, und das ist kein rechtes Spiel.",
      3: "Es gibt viele Wege, allein zu verlieren, und nur eine Straße zum Sieg. Die Siege gehen an den Spieler, der auf das Brett zu sehen weiß. Wer den Weg vor sich nicht sieht, muss sich ändern. Nur durch Änderung entstehen die Verbindungen, und nur so hat etwas Bestand.",
    },
    sayings: {
      0: "Wenn du gewinnst, halte deine Form. Wenn du verlierst, geh hinein.",
      1: "Ergreif die Initiative und behalte sie, Zug um Zug, vom ersten Stein bis zum letzten.",
      2: "Ein verzweifelter Kampf um Verlorenes verliert mehr.",
      3: "Steine, die einer toten Gruppe zugefügt werden, sind gesetzt, ohne gesetzt zu sein.",
      4: "Es gibt viele Wege, allein zu verlieren, und nur eine Straße zum Sieg.",
      5: "Wer den Weg vor sich nicht sieht, muss sich ändern. Nur durch Änderung entstehen die Verbindungen.",
    },
  },
  8: {
    title: "Von der Prüfung des Herzens",
    theme: "Das Gemüt entscheidet mehr Partien als die Technik.",
    plain: "Das Gemüt entscheidet mehr Partien als die Technik. Sei deiner selbst sicher und trotzdem bescheiden, such nach einer Niederlage deinen eigenen Fehler, und lass dein Gesicht nichts verraten.",
    text: {
      0: "Bei der Geburt ist ein Mensch ruhig, und was er fühlt, ist schwer zu lesen. Hat die Welt erst an ihm gearbeitet, wird er tätig, und sein Gemütszustand lässt sich sehen. Wende das auf das Spiel an, und du kannst einen Sieg oder eine Niederlage ansagen, ehe sie eintrifft.",
      1: "Deiner selbst sicher und doch bescheiden, wirst du oft gewinnen. Unsicher und doch stolz, wirst du oft verlieren. Halte deine Stellungen, ohne zu kämpfen, und du wirst gewinnen; töte endlos Steine, ohne dich um sonst etwas zu kümmern, und du wirst verlieren. Denk darüber nach, warum du verloren hast, und dein Spiel wird besser. Schmeichle dir mit einem Sieg, und dein Können geht. Such den Fehler bei dir und gib keinem anderen die Schuld.",
      2: "Anzugreifen, ohne auf den Gegenangriff zu achten, ist ein schlechter Handel. Das Denken wird vollendet, indem man den ganzen Kampf sich entfalten sieht; ein Kopf bei anderen Dingen ist ein verwirrter. Gute Spieler wägen jeden Teil der Stellung ab. Du bist stark, wenn du den anderen wirklich innehalten lassen kannst, und auf dem Weg zur Niederlage, wenn du dich nur daran freust, dass er dein Niveau nicht erreicht.",
      3: "Wenn du es vermagst, kannst du Gedanken zusammensetzen. Ein einziger Plan im Kopf ist wahrhaftig sehr wenig. Sag nichts und bleib unlesbar, damit dein Gegner nicht raten kann und arbeiten muss. Aufgeregt und dann ruhig, ohne Stetigkeit dazwischen, wirst du ihn nur verärgern.",
    },
    sayings: {
      0: "Deiner selbst sicher und doch bescheiden, wirst du oft gewinnen. Unsicher und doch stolz, wirst du oft verlieren.",
      1: "Such nach einer Niederlage den Grund bei dir. Gib keinem anderen die Schuld.",
      2: "Wer sich mit einem Sieg schmeichelt, verliert schon sein Können.",
      3: "Greif an, ohne auf den Gegenangriff zu achten, und du bist der in Gefahr.",
      4: "Ein einziger Plan im Kopf ist wahrhaftig sehr wenig.",
      5: "Halt dein Gesicht still. Dein Gegner soll deinen Plan nicht daraus lesen.",
    },
  },
  9: {
    title: "Von der Richtigkeit",
    theme: "Das Spiel belohnt Tiefe, nicht Tricks.",
    plain: "Das Spiel ist eine Art Krieg, kein Schwindel. Stärke ist tiefes Lesen und Geduld, nie Tricks, Geschwätz oder das Warten darauf, dass der andere sich vertut.",
    text: {
      0: "Manche haben gesagt, dieses Spiel behandle Wandel und Täuschung als notwendig und Einfall und Töten als seine gewöhnlichen Begriffe, und gefragt, ob es damit nicht ein falscher Weg sei. Keineswegs.",
      1: "Ein Heer im Feld braucht klar bestimmte Regeln, sonst ist es in Gefahr. Ein Heer darf nie getäuscht werden: falsche Worte und der Weg zum Verrat gehören den Ränkeschmieden der Streitenden Reiche. Dies ist ein kleiner Weg, aber es ist derselbe Weg wie der Krieg.",
      2: "Es gibt viele Spielstufen, und die Spieler sind nicht gleich. Die auf niedriger Stufe spielen ohne Nachdenken und handeln nur, um irrezuführen. Manche helfen ihrem Denken nach, indem sie auf die Steine zeigen; manche reden und geben ihre Absichten preis. Spieler, die weit gekommen sind, tun nichts davon. Sie denken tief, wägen die fernen Folgen ab, nutzen, was die Formen bieten, während die Steine fallen, und lassen ihre Gedanken über das Brett wandern, ehe ein einziger Stein gesetzt ist. Sie zielen auf den Sieg, bevor der Sieg sichtbar ist, und nehmen den Punkt, bevor der Gegner an ihn gedacht hat.",
      3: "Würden solche Spieler ihr Spiel auf zu vieles Reden und Herumfuchteln gründen? Sei ehrlich und nicht unrichtig. Genau das ist der Punkt.",
    },
    sayings: {
      0: "Ein kleiner Weg, aber derselbe Weg wie der Krieg.",
      1: "Denk tief, wäg die fernen Folgen ab, und lass deine Gedanken über das Brett wandern, ehe du einen Stein setzt.",
      2: "Gewinn, bevor das Gewinnen sichtbar ist. Nimm den Punkt, bevor dein Gegner an ihn denkt.",
      3: "Sei ehrlich. Täusche nicht.",
    },
  },
  10: {
    title: "Vom Achten auf die Einzelheiten",
    theme: "Das Mittelspiel sind hundert kleine Urteile.",
    plain: "Das Mittelspiel sind hundert kleine Urteile. Ordne das Innere, bevor du dich außen anlehnst, brich eine Reihe von Steinen auf, bevor sie Augen macht, und kämpf nur ein Ko, dessen Verlust du dir leisten kannst.",
    text: {
      0: "Im Spiel gibt es manchmal einen Vorteil, wo keiner ist, und manchmal umgekehrt. Der Einfall gilt gemeinhin als gut, und doch gibt es Einfälle, die nur dem Einfallenden schaden. Manchmal liegt der Gewinn links und manchmal rechts. Manchmal hältst du die Initiative und manchmal bist du ihr unterworfen. Manchmal stehen die Steine dicht beieinander und manchmal weit auseinander.",
      1: "Wenn du verbindest, vergiss nicht, was vorher war. Wenn du Steine hergibst, denk an das, was folgt. Manchmal beginnst du nah bei bestimmten Steinen und endest weit von ihnen; manchmal hast du wenige an einem Ort und endest mit vielen.",
      2: "Um das Äußere zu stärken, ordne zuerst das Innere. Um den Osten zu halten, schlag im Westen. Steine des Gegners, die in einer Reihe stehen und noch keine Augen gemacht haben, sollten früh aufgebrochen werden. Kämpf ein Ko, wenn es deine anderen Gruppen nichts kostet. Nimmt der Gegner Vorgabesteine, so leg deine eigenen großzügig aus: ein Spieler mit Vorgabesteinen meidet die Schlacht und erweitert stattdessen.",
      3: "Wähl ein Gebiet sorgfältig, bevor du einfällst, vergewissere dich, dass nichts im Weg steht, und geh dann hinein. Das gehört zu den besten Methoden, die die starken Spieler gebrauchen, und sie kennen sie gut genug.",
    },
    sayings: {
      0: "Manche Vorteile sind keine Vorteile. Manche Einfälle schaden nur dem Einfallenden.",
      1: "Um das Äußere zu stärken, ordne zuerst das Innere. Um den Osten zu halten, schlag im Westen.",
      2: "Wenn du verbindest, denk daran, was vorher war. Wenn du opferst, denk an das, was danach kommt.",
      3: "Kämpf ein Ko nur, wenn es deine anderen Gruppen nichts kostet.",
      4: "Wähl ein Gebiet sorgfältig, bevor du einfällst. Dann geh hinein.",
    },
  },
  11: {
    title: "Von den Namen",
    theme: "Zweiunddreißig Namen für Formen, und zehntausend Wandlungen.",
    plain: "Jede Anordnung auf dem Brett hat einen Namen, und die Namen sind es, womit ein Spieler schnell über Formen nachdenkt. Es sind hier zweiunddreißig, und mehr Varianten, als je einer zählen wird.",
    text: {
      0: "Die Spieler haben jeder Anordnung einen genauen Namen gegeben. Manche davon sind schon von außen deutlich genug, wie Leben und Tod oder sich festsetzen und verschwinden.",
      1: "Es gibt zweiunddreißig dieser Fachnamen, und ihnen gegenüber müssen die Spieler zehntausend Varianten im Kopf behalten. Alle Wandlungen, die das Brett zulässt, nah und fern, quer und längs, sind so viele, dass selbst ich sie nie alle kennen werde. Dennoch kommt man schwer ohne die Namen aus, wenn man auf Sieg spielt.",
      2: "Das alte Buch sagt, die Namen müssten richtiggestellt werden. Gilt das nicht auch hier?",
    },
    sayings: {
      0: "Zweiunddreißig Namen, und zehntausend Wandlungen.",
      1: "Stell die Namen richtig, und die Formen lassen sich sehen.",
    },
  },
  12: {
    title: "Von den neun Stufen",
    theme: "Jeder Spieler steht auf einer von neun Stufen. Tiefer zu lesen ist der Aufstieg.",
    plain: "Stärke kommt in neun Stufen, vom Spieler, der das ganze Brett auf einen Blick sieht, bis zu dem, der noch herumfummelt. Man steigt durch tieferes Lesen, nicht durch mehr Partien.",
    text: {
      0: "Die Spieler werden nach neun Stufen des Geistes unterschieden. Die erste ist, im Geist zu sein. Die zweite, in der Erleuchtung zu sitzen. Die dritte, das Ganze zu halten. Die vierte, die Wandlungen zu durchschauen. Die fünfte, Weisheit anzuwenden. Die sechste, kleine Kunst. Die siebte, mit Kraft zu kämpfen. Die achte, ungeschickt zu wirken. Die neunte und letzte, bei der Unbeholfenheit zu bleiben.",
      1: "Stufen unterhalb dieser lassen sich nicht sinnvoll zählen, und da sie nicht auf die Liste gehören, werden sie hier nicht behandelt.",
      2: "Vom überlegenen Menschen heißt es, er habe vollkommenes Wissen von Geburt an; wer es durch Studium erlangt, steht etwas tiefer; und der geringere Mensch studiert erst, nachdem er auf Schwierigkeiten gestoßen ist.",
    },
    sayings: {
      0: "Neun Stufen, vom Im-Geist-Sein hinunter bis zum wahrhaft Verlorenen. Jeder Spieler steht auf einer von ihnen.",
      1: "Die Weisen studieren, bevor die Schwierigkeit kommt. Die übrigen studieren danach.",
    },
  },
  13: {
    title: "Vermischtes",
    theme: "Eckformen, Augengrößen und wie man am Brett sitzt.",
    plain: "Das letzte Kapitel ist alles Übriggebliebene: Eckformen, die man auswendig kennen sollte, und wie man an einem Brett sitzt. Spiel nicht müde, prahl nicht, und entspann dich nicht, weil die Stellung ruhig aussieht.",
    text: {
      0: "Auf dem Brett zählen die Seiten weniger als die Ecken und die Ecken weniger als die Mitte. Ein großes Auge schlägt ein kleines. Eine schräge Linie ist weniger wert als eine gerade. Lauf keine Leiter, wenn der Gegner Steine auf ihrem Weg warten hat. Kommt ein Angriff nicht zustande, so geh nicht geradewegs auf denselben Punkt zurück.",
      1: "Am Ende einer Partie sind vier Steine, in einer Ecke um zwei Punkte gebogen, tot; sechs in der Ecke um vier Punkte leben; und die lange Zwei-mal-Drei-Form lebt ebenfalls. Die Blume aus fünf Punkten, in ihrer Mitte getroffen, hat fast kein Leben mehr in sich. Wo vier Steine als Quadrat in der Ecke sitzen, zwei jeder Farbe, eile nicht hinein, um zu fangen.",
      2: "Spiel nicht viele Partien hintereinander: müde Spieler spielen schlecht. Spiel nicht, wenn du unwohl bist, denn du wirst die Züge vergessen und leicht verlieren. Prahl nicht mit einem Sieg und klag nicht über eine Niederlage. Einem anständigen Spieler steht es an, bescheiden und großzügig zu wirken; nur die Gewöhnlichen zeigen Zorn. Ein starker Spieler soll sein Können nicht zur Schau stellen, und ein Anfänger soll nicht zaghaft sein, sondern ruhig sitzen und gleichmäßig atmen, dann ist die Schlacht halb gewonnen. Ein Gesicht, das einen aufgewühlten Geist zeigt, verliert schon.",
      3: "Die schlimmste Schande ist ein Sinneswandel, und das Niedrigste ist zu täuschen. Es gibt keinen törichteren Zug als ein Ko, das um nichts gekämpft wird. Wenn du zählst, ärgere dich nicht darüber, wie viel du genommen hast. Da die Spieler nicht gleich sind, musst du manchmal den ersten Zug abtreten, oder zwei Steine, oder fünf, oder sieben.",
      4: "In diesem Spiel ist das Leben des einen der Tod des anderen. Nah und fern vollenden einander, die Stärke der einen Seite ist die Schwäche der anderen, der Gewinn der einen der Verlust der anderen. Das ist Frieden ohne Bequemlichkeit: du magst dich festsetzen, aber du darfst nicht stillsitzen. Hinter der Ruhe verbirgt sich die Gefahr, und stillzusitzen heißt, ausgelöscht zu werden. Im Frieden vergiss die Gefahr nicht. Sicher in deiner Stellung, vergiss nicht, dass sie zerstört werden kann.",
    },
    sayings: {
      0: "Prahl nicht mit einem Sieg. Klag nicht über eine Niederlage.",
      1: "Sitz ruhig und atme gleichmäßig. Die Schlacht ist halb gewonnen.",
      2: "Ein Gesicht, das den Geist zeigt, verliert schon.",
      3: "Spiel nicht viele Partien hintereinander. Müde Spieler spielen nicht gut.",
      4: "Ein großes Auge schlägt ein kleines Auge. Eine gerade Linie schlägt eine schräge.",
      5: "Es gibt keinen törichteren Zug als ein Ko, das um nichts gekämpft wird.",
      6: "Das Leben des einen ist der Tod des anderen. Im Frieden vergiss die Gefahr nicht.",
    },
  },
};

export const name = {
  1: { modern: "Stoß", text: "Geradeaus gegen einen Kontaktstein spielen, einen Punkt nach dem anderen." },
  2: { text: "Ein Dreh- oder Keilzug. Die genaue Form ist nicht mehr sicher." },
  3: { text: "Ein Zug, leicht an die Flanke eines Steins gesetzt." },
  4: { text: "In Kapitel dreizehn noch einmal genannt, als Antwort auf eine andere Form, und das ist alles, was wir davon wissen." },
  5: { modern: "Springerzug", text: "Der Keima: einen quer und zwei längs, das Arbeitspferd der Eröffnung." },
  6: { modern: "Einpunktsprung", text: "Geradewegs hinaus, mit einer Lücke. Der Klassiker nennt zwei davon, die einander gegenüberstehen, ein Signal, sofort zu spielen." },
  7: { text: "Ein stoßender Zug. Die Lesung ist ohne das Schriftzeichen unsicher." },
  8: { text: "Ein blockender oder drückender Zug." },
  9: { modern: "Kopfstoß", text: "Von unten frontal gegen einen Stein spielen." },
  10: { modern: "Diagonale", text: "Der Kosumi: einen Punkt schräg, langsam und sehr schwer zu schneiden." },
  11: { text: "Nicht identifiziert. Einer der Namen, die das Spiel nicht behalten hat." },
  12: { modern: "Netz", text: "Das Geta: fangen durch Einschließen auf Abstand statt durch Jagen." },
  13: { modern: "Atari", text: "Der Zug, der eine Gruppe auf eine Freiheit herunterbringt." },
  14: { modern: "Schnitt", text: "Zwei Steine des Gegners trennen, sodass sie getrennt leben müssen." },
  15: { modern: "Gehen", text: "Eine Linie entlang vorrücken, Stein für Stein." },
  16: { modern: "Gegen den Strich", text: "Ein Zug, absichtlich verkehrt herum gespielt, oder in umgekehrtem Sente." },
  17: { modern: "Abstieg", text: "Geradewegs zum Rand hinuntergehen, meist um Freiheiten zu gewinnen." },
  18: { modern: "Setzung", text: "Ein Stein, ins Innere einer Form gesetzt, auf den Punkt, den die Form nicht verlieren darf." },
  19: { text: "Ein schlagender oder quetschender Zug. Nicht mit Sicherheit identifiziert." },
  20: { text: "Ein Zug, nach seiner Klugheit benannt statt nach seiner Form." },
  21: { modern: "Zange", text: "Einen Annäherungsstein von der fernen Seite angreifen, sodass er sich nirgends leicht festsetzen kann." },
  22: { text: "In Kapitel dreizehn noch einmal genannt, wo die übliche Antwort darauf eine andere Form dieser Liste ist." },
  23: { modern: "Hane", text: "Schräg um den Kopf eines Steins herumgreifen." },
  24: { modern: "Peep", text: "Drohen, durch eine Lücke zu schneiden, sodass der Gegner antworten muss." },
  25: { text: "Nicht identifiziert. Möglicherweise ein Sondierungszug." },
  26: { text: "Ein trennender Zug. Die Lesung ist unsicher." },
  27: { modern: "Leiter", text: "Der Treppenfang, vor dessen Beginn der Klassiker warnt, wenn gegnerische Steine auf seinem Weg liegen." },
  28: { modern: "Ko", text: "Der sich wiederholende Fang. Kapitel dreizehn nennt ein Ko, das um nichts gekämpft wird, den törichtsten Zug, den es gibt." },
  29: { modern: "Fang", text: "Steine vom Brett nehmen." },
  30: { modern: "Töten", text: "Einer Gruppe das Leben nehmen, ob die Steine nun heruntergenommen werden oder nicht." },
  31: { modern: "Lose", text: "Auf Abstand spielen, dünn, ohne etwas zu klären." },
  32: { modern: "Ganzes Brett", text: "Das Brett als eine Sache genommen, und dort landet Kapitel elf." },
};

export const passage = {
  0: "Das Brett ist viereckig und still; die Steine sind rund und bewegen sich. Seit dem Anfang hat niemand die Steine je genau so gesetzt, wie sie in einer früheren Partie gesetzt waren. Jeder Tag ist neu. Das Denken muss also tief gehen und das Lesen genau sein, und du musst zu verstehen suchen, was zum Sieg und was zur Niederlage führt. Nur so lässt sich erreichen, was noch nicht erreicht ist.",
  1: "Dreihundertsechzig Punkte für die Tage des Jahres, und einer mehr in der Mitte, aus dem sie alle kommen. Vier Ecken für die vier Jahreszeiten, neunzig Punkte jede. Ein ganzes Jahr liegt auf dem Tisch, bevor der erste Stein gesetzt ist.",
  2: "Wer viel rechnet, wird gewinnen, und wer wenig rechnet, wird verlieren. Was also ist mit dem, der gar nicht rechnet? Kannst du sagen, wer führt, während die Steine noch fallen, hast du gut gezählt. Erfährst du es erst, wenn sie eingesammelt werden, hast du schlecht gezählt.",
  3: "Zu Beginn verteilen sich die Stellungen auf die vier Ecken. Dann treten die Steine heraus: zwei Punkte von einem Stein, drei von zweien, vier von dreien. Nah ist nicht berührend; weit ist nicht außer Reichweite. Ohne guten Anfang kein gutes Ende.",
  4: "Statt Steine zu pflegen, die schon in Gefahr sind, lass sie ziehen und nimm neuen Boden. Viele Steine dürfen verloren gehen, solange die Initiative es nicht tut, denn die Initiative zu verlieren heißt, sie jemandem zu geben, der sie vorher nicht hatte. Bevor du nach links schlägst, sieh nach rechts.",
  5: "Der beste Sieg ist der ohne Kampf gewonnene, und die beste Stellung die, die keinen Kampf herausfordert. Kämpf gut, und du wirst nicht verlieren; halt deine Reihen in Ordnung, und selbst deine Verluste sind sauber. Eröffne nach den Regeln. Gewinne mit Vorstellungskraft.",
  6: "Spiel zu nah an deinem Gegner, und du füllst ihn, während du dich selbst leerst. Was voll ist, lässt sich schwer brechen; was leer ist, lässt sich leicht betreten. Wie das Wasser, das die Höhen verlässt und hinunterfließt, meide, was schon voll ist, und geh in die Leere.",
  7: "Halt nicht an einem Plan fest. Ändere ihn mit dem Augenblick. Siehst du, dass du vorrücken kannst, rück vor. Triffst du auf Schwierigkeiten, zieh dich zurück. Greif etwas und behalte dieselbe Methode, und am Ende hast du nur dieses eine Ding gegriffen.",
  8: "Die Weisen sehen, was noch nicht sichtbar ist; die Törichten übersehen, was vor ihren Augen liegt. Kenn deine eigenen schwachen Stellen, und du weißt, wo dein Gegner kommt. Wisse, wann zu kämpfen und wann abzulehnen ist. Ruh dich aus, und lass die andere Seite sich selbst erschöpfen. Wer sich selbst kennt, ist erleuchtet.",
  9: "Siehst du, dass du gewinnst, so halte deine Form. Siehst du, dass du verlierst, so geh in die größeren Gebiete. Ein verzweifelter Kampf um Verlorenes verliert nur mehr. Es gibt viele Wege, allein zu verlieren, und nur eine Straße zum Sieg: das Brett zu sehen, wie es ist.",
  10: "Wer den Weg vor sich nicht sieht, muss sich ändern. Nur durch Änderung entstehen die Verbindungen, und nur dann lebt eine Gruppe lange.",
  11: "Deiner selbst sicher und doch bescheiden, wirst du oft gewinnen. Unsicher und stolz, wirst du oft verlieren. Denk nach einer Niederlage über ihre Ursachen nach, und dein Können wächst; schmeichle dir mit einem Sieg, und es verlässt dich. Such den Fehler bei dir und gib keinem anderen die Schuld.",
  12: "Halt dein Gesicht still und deine Pläne verborgen, damit dein Gegner deine Gedanken nicht in deiner Miene lesen kann. Ein einziger Plan im Kopf ist wahrhaftig sehr wenig. Der kundige Spieler wägt jede Seite der Partie ab; der unbesonnene rüstet sich nur an der Oberfläche zur Schlacht.",
  13: "Ein kleiner Weg, aber derselbe Weg wie der Krieg. Der starke Spieler denkt tief, wägt die fernen Folgen ab und lässt den Gedanken über das ganze Brett wandern, ehe ein einziger Stein gesetzt ist. Er zielt auf die Eroberung, bevor die Eroberung sichtbar ist, und nimmt den Punkt, bevor der Gegner an ihn gedacht hat.",
  14: "Um das Äußere zu stärken, ordne zuerst das Innere. Um den Osten zu halten, schlag im Westen. Wenn du verbindest, denk daran, was vorher war. Wenn du opferst, denk an das, was danach kommt. Wähl ein Gebiet sorgfältig, bevor du einfällst; dann geh hinein.",
  15: "Zweiunddreißig Namen für die Arten, wie Steine einander begegnen, und zehntausend Wandlungen, an die zu denken ist. Alle Verschiebungen des Bretts, nah und fern, quer und hinunter, sind mehr, als je einer wissen wird. Stell die Namen richtig, und die Formen lassen sich sehen.",
  16: "Neun Stufen von Spielern, vom Im-Geist-Sein an der Spitze hinunter bis zum wahrhaft Verlorenen. Der überlegene Mensch weiß von Geburt an, der nächste lernt durch Studium, und die übrigen studieren erst, nachdem die Schwierigkeit sie gefunden hat.",
  17: "Prahl nicht mit dem Sieg und klag nicht über die Niederlage. Der Edle wirkt bescheiden und großzügig; nur die Gewöhnlichen zeigen Zorn. Sitz ruhig und atme gleichmäßig, und die Schlacht ist halb gewonnen. Ein Gesicht, das den Geist verrät, verliert schon.",
  18: "In diesem Spiel ist das Leben des einen der Tod des anderen; nah und fern vollenden einander; die Stärke des einen ist die Schwäche des anderen. Das ist Frieden, aber keine Ruhe. Hinter der Ruhe wartet die Gefahr, und stillzusitzen heißt, fortgeschwemmt zu werden. Die Weisen sind in Frieden und vergessen die Gefahr nicht.",
  19: "Spiel nicht viele Partien hintereinander, denn die Müden spielen schlecht. Spiel nicht, wenn du unwohl bist, denn du wirst die Züge vergessen und leicht geschlagen werden. Ein Wettkampf sind nie mehr als drei Partien zusammen.",
};
