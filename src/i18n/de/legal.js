// de · legal
export const legal = {
  eyebrow: "Das Kleingedruckte",
  stamp: "Zuletzt geändert: {date}",
  tabs: "Kleingedrucktes",
  translated: "Dies ist eine Übersetzung, damit es gelesen werden kann. Maßgeblich ist die englische Fassung.",

  /* ----- Overlays: die drei Dokumente, aus src/content/legal.js -----
     Die Konstanten kommen als Löcher an ({product}, {studio}, {contact},
     {repo}, {copyright}), statt hineinkopiert zu werden, sodass eine Änderung
     der Adresse sie in allen Sprachen zugleich ändert. */
};

export const legalDoc = {
  terms: {
    title: "Nutzungsbedingungen",
    blurb: "Was du von Joseki erwarten darfst und was Joseki von dir erwartet.",
    sections: {
      0: {
        heading: "Was das hier ist",
        paras: {
          0: "{product} ist ein Ort, um Go zu spielen, betrieben von {studio}. Es kostet nichts, trägt keine Werbung und verkauft nichts. Das ist keine Werbung, sondern die ganze geschäftliche Abmachung, und diese Bedingungen sind kurz, weil es so wenig abzumachen gibt.",
          1: "Joseki zu benutzen heißt, dem Folgenden zuzustimmen. Wenn du lieber nicht möchtest, gehört das Brett trotzdem dir: du kannst jederzeit aufstehen.",
        },
      },
      1: {
        heading: "Ohne Konto spielen",
        paras: {
          0: "Die Lektionen, die Tsumego, die Hausspieler und dein Rang laufen alle in deinem Browser und brauchen überhaupt kein Konto. Nichts davon wird irgendwohin gesendet. Alles Folgende über Konten gilt erst, wenn du dich entscheidest, online gegen Menschen zu spielen.",
        },
      },
      2: {
        heading: "Dein Konto",
        paras: {
          0: "Ein Konto ist ein Name, eine Wertung und, wenn du eine angibst, eine Adresse, mit der du wieder hineinkommst. Du bist für das Passwort verantwortlich, das du wählst, und für das, was unter deinem Namen am Brett getan wird.",
          1: "Joseki kann kein Passwort wiederherstellen. Hast du eine Adresse angegeben, kann ein Brief ein neues setzen. Hast du keine, ist ein Konto, dessen Passwort verloren geht, mit ihm verloren. Das ist der ehrliche Tausch dafür, so wenig über dich zu speichern.",
          2: "Joseki ist nicht für Kinder unter 13 gebaut, und für eines sollte kein Konto angelegt werden.",
        },
      },
      3: {
        heading: "Wie man sich am Brett benimmt",
        paras: {
          0: "Eine kurze Liste, und nichts daran wird jemanden überraschen, der schon in einem Verein gespielt hat.",
        },
        list: {
          0: "Spiel deine eigenen Züge. Während einer gewerteten Partie gegen einen Menschen eine Engine zu befragen ist Betrug, und absichtlich zu verlieren, um eine Wertung zu bewegen, ebenso.",
          1: "Halt den Chat anständig. Belästigung, Beschimpfungen und der üble Umgang mit einem Gegner oder einem Zuschauer sind schon beim ersten Mal ein Grund für den Ausschluss.",
          2: "Automatisiere die API nicht, leg keine Konten in Serie an, und such nicht nach Teilen des Servers, die dir nicht gehören.",
          3: "Lad kein Bild hoch, das du nicht verwenden darfst, und keines, mit dem sich niemand hingesetzt hat zu rechnen.",
        },
      },
      4: {
        heading: "Was du schreibst, bleibt deins",
        paras: {
          0: "Dein Steckbrief, deine Chat-Zeilen und dein Bild gehören dir. Sie in Joseki einzustellen erlaubt dem Studio, sie zu speichern und dort zu zeigen, wo das Produkt sie zeigt: in deinem Profil, in dem Raum, in dem du spielst, und danach im Protokoll.",
          1: "Das Protokoll einer Partie ist das Protokoll einer Partie, die zwei Menschen gespielt haben. Joseki bewahrt beendete Partien auf und darf sie den Spielenden zeigen und jedem, der den Link zu diesem Raum hat.",
        },
      },
      5: {
        heading: "Was das Studio tun darf",
        paras: {
          0: "Ein Konto, das die obigen Regeln bricht, kann gesperrt oder entfernt werden, und das Studio schuldet davor keine Anhörung. Wenn etwas, das du ehrlich aufgebaut hast, irrtümlich genommen wurde, schreib, und ein Mensch sieht es sich an.",
        },
      },
      6: {
        heading: "Kein Versprechen, dass es morgen noch da ist",
        paras: {
          0: "Joseki ist ein kleines Projekt, betrieben von einem kleinen Studio. Es kann sich ändern, kaputtgehen, eine Wertung verlieren oder ganz aufhören. Es gibt keine Verfügbarkeitszusage, keine Sicherung, nach der man rufen könnte, und keinen Support. Es gibt eine Adresse, und einen Menschen, der sie liest.",
          1: "Bewahr auf, was dir leidtäte zu verlieren. Jede beendete Partie lässt sich von der Ergebniskarte aus als SGF-Datei sichern, und diese Datei gehört dir, um sie dort zu behalten, wohin Joseki nicht reicht.",
        },
      },
      7: {
        heading: "Keine Gewährleistung, und was sich fordern lässt",
        paras: {
          0: "Joseki wird so angeboten, wie es ist, ohne Gewährleistung irgendeiner Art, soweit das Gesetz es zulässt. Das Studio haftet nicht für Schäden aus der Nutzung: eine verlorene Partie, eine verlorene Wertung, ein verlorenes Konto.",
          1: "Manche Verbraucherrechte lassen sich nicht abbedingen, und hier wird es auch nicht versucht. Wo ein Gesetz dir ein Recht gibt, das dieser Abschnitt nähme, gewinnt das Gesetz, und der Rest des Dokuments bleibt bestehen.",
        },
      },
      8: {
        heading: "Änderungen",
        paras: {
          0: "Diese Bedingungen ändern sich, indem sie hier neu geschrieben und das Datum oben auf der Seite weitergerückt wird. Danach weiterzuspielen ist die Art, zuzustimmen. Es gibt keinen Verteiler, auf dem das angekündigt würde, weil es keinen Verteiler gibt.",
        },
      },
      9: {
        heading: "Welches Recht gilt",
        paras: {
          0: "{studio} arbeitet von Kanada aus, und diese Bedingungen unterliegen dem Recht Kanadas. Der Ort, an dem du lebst, kann dir zusätzlich Rechte vor deinen eigenen Gerichten geben, und diese Klausel versucht nicht, sie dir zu nehmen.",
        },
      },
      10: {
        heading: "Wie man Kontakt aufnimmt",
        paras: {
          0: "Was auch immer: {contact}. Fehler sind offen genauso willkommen, unter {repo}.",
        },
      },
    },
  },

  privacy: {
    title: "Datenschutz",
    blurb: "Was Joseki über dich weiß, und das ist sehr wenig, und wo genau es liegt.",
    sections: {
      0: {
        heading: "Die kurze Fassung",
        paras: {
          0: "Es gibt kein Analyse-Skript, kein Werbenetzwerk, kein Zählpixel und kein Cookie irgendeiner Art. Joseki hat noch nie einen Besuch gezählt.",
          1: "Spiel für dich, und nichts verlässt dein Gerät. Spiel gegen Menschen, und der Server bewahrt die Handvoll Dinge auf, die unten aufgezählt sind, weil eine Partie zwischen zwei Menschen ohne sie nicht stattfinden kann.",
        },
      },
      1: {
        heading: "Was auf diesem Gerät bleibt",
        paras: {
          0: "Dein Name, die Farbe deines Zeichens, dein Rang, deine erledigten Lektionen und Aufgaben, der Raum und die Schriftpaarung, die du gewählt hast, die laufende Partie und der letzte Tisch, den du hergerichtet hast. Das alles liegt im lokalen Speicher deines Browsers, unter Josekis eigenen Schlüsseln, und nichts davon wird irgendwohin gesendet.",
          1: "Die Websitedaten für Joseki zu löschen löscht jedes einzelne davon, und es gibt anderswo keine Kopie, aus der sich etwas wiederherstellen ließe.",
        },
      },
      2: {
        heading: "Was der Server bewahrt, sobald du online spielst",
        paras: {
          0: "Nur wenn du einen Namen fürs Onlinespiel anmeldest, und nur dies.",
        },
        list: {
          0: "Deinen Namen, die Farbe deines Zeichens, deine Wertung und ihre Abweichung, und deine Siege, Niederlagen und Unentschieden.",
          1: "Deine E-Mail-Adresse, wenn du eine angegeben hast, und ob du sie bestätigt hast. Ein Name lässt sich auch ohne anlegen.",
          2: "Nie dein Passwort. Der Browser streckt es zu einem Schlüssel, bevor es gesendet wird, und gespeichert wird ein gesalzener Hash dieses Schlüssels.",
          3: "Die Anmeldemarken deiner offenen Sitzungen, als Hashes gespeichert, damit ein gestohlener Speicher kein Bund funktionierender Schlüssel ist.",
          4: "Was du deinem Profil hinzufügen wolltest: einen Absatz von höchstens 280 Zeichen, drei kurze Angaben und ein Bild von höchstens 64 KB.",
          5: "Die Partien, die du online gespielt hast, und bis zu 200 Chat-Zeilen in jedem Raum neben dem Protokoll.",
          6: "Die Adresse, von der aus du dich angemeldet hast, aufbewahrt, damit ein Austritt das Konto zurückgibt, das sie verbraucht hat, niemandem gezeigt und mit dem Konto gelöscht.",
        },
      },
      3: {
        heading: "Wofür deine E-Mail-Adresse gebraucht wird",
        paras: {
          0: "Zwei Briefe, und sonst nichts: einer, der bestätigt, dass die Adresse dir gehört, und einer, mit dem du ein neues Passwort setzen kannst. Es gibt keinen Newsletter, keine Produktankündigung und keine Liste, auf der man stünde. Die Adresse wird nie verkauft, vermietet oder jemandem zum eigenen Gebrauch überlassen.",
        },
      },
      4: {
        heading: "Wer sonst etwas davon sieht",
        paras: {
          0: "Drei Unternehmen, und alle drei stehen der Seite eher im Weg, als dass sie sich für sie interessierten.",
        },
        list: {
          0: "Cloudflare betreibt den Spielserver und verschickt die beiden Briefe. Alles, was der Server bewahrt, liegt in ihrem Netz, das Länder außerhalb Kanadas umfasst.",
          1: "GitHub liefert die App selbst aus, über GitHub Pages, und ihre Server sehen die Anfrage, die sie holt.",
          2: "Google Fonts liefert fünf Schriften. Sie zu holen sagt Google, von welcher Adresse die Anfrage kam, genau wie es eine von irgendwoher gelieferte Schrift täte.",
          3: "Sonst niemand. Es gibt keine vierte Partei und keine Abmachung mit einer.",
        },
      },
      5: {
        heading: "Gehen",
        paras: {
          0: "Es gibt einen Weg hinaus, der niemandes Erlaubnis braucht. Zu gehen entfernt dein Konto, deine Sitzungen, deine Adresse, dein Bild, deinen Platz in der Rangliste und die Spur der Adresse, von der aus du dich angemeldet hast.",
          1: "Eines überlebt, und das gehört klar gesagt: eine beendete Partie bleibt in dem Raum, in dem sie gespielt wurde, unter dem Namen, unter dem du sie gespielt hast. Sie gehört deinem Gegner so sehr wie dir, und sie wegzunehmen nähme auch seine weg.",
          2: "Um eine Kopie dessen zu verlangen, was über dich gespeichert ist, um es zu berichtigen oder um etwas entfernen zu lassen, das ein Austritt nicht erreicht, schreib an {contact}, und ein Mensch erledigt es von Hand. Es gibt keinen Export-Knopf, und etwas anderes zu sagen wäre der leicht zu schreibende Satz und der falsche.",
        },
      },
      6: {
        heading: "Kinder",
        paras: {
          0: "Joseki richtet sich nicht an Kinder unter 13, und für eines sollte kein Konto angelegt werden. Ist es doch geschehen, schreib, und es wird entfernt, ohne dass vorher noch etwas anderes verlangt wird.",
        },
      },
      7: {
        heading: "Änderungen",
        paras: {
          0: "Dieser Hinweis ändert sich, indem er hier neu geschrieben und das Datum oben weitergerückt wird. Sollte er sich je ändern, weil Joseki angefangen hat, etwas Neues zu erheben, wird die Änderung das in einem eigenen Satz sagen, statt in einen Absatz gefaltet zu werden.",
        },
      },
      8: {
        heading: "Wie man Kontakt aufnimmt",
        paras: {
          0: "Jede Frage zu all dem: {contact}.",
        },
      },
    },
  },

  credits: {
    title: "Danksagungen und Urheberrecht",
    blurb: "Aus wessen Arbeit das hier gebaut ist, und was wem gehört.",
    sections: {
      0: {
        heading: "Der Teil, der uns gehört",
        paras: {
          0: "{copyright}. Der Code, das Designsystem, die Lektionen, die Stimmen der Hausspieler und die Übersetzungen im Lesezimmer sind die Arbeit des Studios und nicht zur Weiterverwendung lizenziert. Alle Rechte vorbehalten.",
          1: "Frag trotzdem. Eine Bitte, ein Stück davon für den Unterricht oder für einen Verein zu verwenden, ist noch nie abgelehnt worden, und die Adresse am Fuß dieser Seite erreicht einen Menschen.",
        },
      },
      1: {
        heading: "Der Teil, der niemandem gehört",
        paras: {
          0: "Go selbst gehört niemandem. Die Regeln, die Sprichwörter, die klassischen Aufgaben und die Partien, die die alten Meister gespielt haben, sind das gemeinsame Erbe aller, die sich an ein Brett setzen, und Joseki beansprucht keines davon.",
        },
      },
      2: {
        heading: "Wie man Kontakt aufnimmt",
        paras: {
          0: "Eine falsche Danksagung, oder eine fehlende, ist einen Hinweis wert: {contact}. Im nächsten Build steht sie richtig.",
        },
      },
    },
  },
};

export const credit = {
  software: {
    title: "Software",
    note: "Joseki ist auf der Arbeit anderer Menschen gebaut, und sie ist durchweg quelloffen.",
    items: {
      3: { terms: "MIT, nur für den Build" },
    },
  },
  type: {
    title: "Schrift",
    note: "Jede Schriftpaarung im Raum ist die Zeichnung von jemandem.",
    items: {
      0: { terms: "Open Font License" },
      1: { terms: "Open Font License" },
      2: { terms: "Open Font License" },
      3: { terms: "Open Font License" },
      4: { terms: "Open Font License" },
      5: { terms: "Bedingungen des Anbieters" },
    },
  },
  board: {
    title: "Was vom Brett selbst kam",
    note: "Das Spiel ist niemandes Eigentum, und die ältesten Schriften darüber sind es auch nicht.",
    items: {
      0: { terms: "gemeinfrei" },
      1: { terms: "gemeinfrei" },
      2: { terms: "gemeinfrei" },
      3: { terms: "eigener Text" },
    },
  },
};
