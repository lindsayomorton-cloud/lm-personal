/* ============ Content for the rooms and the art viewer ============
   To add a project: add an entry to its room below.
   preview: a page to show live, scaled down (optional).
   pics: images for the details pop-up; the first is the backdrop on its card. */
var ROOMS = {
  about: { name: "Study", template: "tpl-about" },
  personal: {
    name: "Playroom",
    lede: "The games I make for my boys.",
    projects: [
      { name: "Van's Cove", kick: "Made for Van", color: "#0e4f6e", preview: "vans-cove/showcase.html",
        one: "My redesign of Treasure Cove, my favorite computer game growing up, made for my son Van.",
        logo: "assets/proj/vans-logo.webp",
        pics: [["assets/proj/vans-shells.webp", ""], ["assets/proj/vans-logo.webp", "Van's Cove"], ["assets/proj/vans-seahorse.webp", "A glowing golden seahorse"], ["assets/proj/vans-diver.gif", "Animated boy diver swimming"]],
        facts: [["What", "A computer game"], ["Made for", "My son Van"], ["Inspired by", "Treasure Cove, my favorite game growing up"]],
        more: "<p>Van dives the reef, finds pearls hidden in giant shells and rides a seahorse chariot through the cove.</p>" },
      { name: "Brick Shop", preview: "games/brick-shop.html", noDetails: true },
      { name: "Wildkind", preview: "wildkind/showcase.html", noDetails: true, one: "A cozy forest arcade where every move is a spelled word." },
      { name: "Kiko's Pond", preview: "kikos-pond/showcase.html", noDetails: true, one: "A pond-building science game for kids who are just learning to read." }
    ]
  },
  career: {
    name: "Workshop",
    /* Career has its own layout: an intro, Pollinate as the big feature, then the other projects in order */
    layout: "career",
    intro: ["Here's what I'm building now."],
    projects: [
      { name: "Pollinate", kick: "Now building", preview: "pollinate/film.html", site: "pollinate/pollen-v8.dc.html", learn: true,
        one: "Better products deserve to spread. Marketing for companies making the world better.",
        pics: [["assets/proj/poll-waves.jpg", ""], ["assets/proj/poll-logo.webp", "Pollinate"]], logo: "assets/proj/poll-logo.webp",
        facts: [["What", "A marketing studio"], ["For", "Brands building the world we want to live in"], ["Clients", "Draper Real Estate, Living in the Heights"], ["Led by", "Me, with a network of senior specialists"]],
        more: "<p>Marketing for companies making the world better.<br>We get your story right, make you easy to find, and turn customers into the people who spread the word.</p>"
          + "<div class=\"pillars\"><div><b>Plant the story.</b><span>Say why it matters, not how it works.</span></div><div><b>Bloom where buyers look.</b><span>Be the first answer buyers find, in search and in AI.</span></div><div><b>Take root.</b><span>Make the first order the first of many.</span></div><div><b>Spread like wildflowers.</b><span>Turn happy customers into your best ads.</span></div></div>"
          + "<p>Founder-led, network-built: I lead it, and a network of senior specialists makes the work.</p>"
          + "<a class=\"ext\" href=\"pollinate/pollen-v8.dc.html\" data-full=\"Pollinate\">See the full Pollinate site ↗</a>" },
      { name: "The Sanctuary", kick: "Invitation only", preview: "sanctuary/preview.html",
        one: "A work, life and organization app for witchy, spiritual women who want to feel powerful.",
        facts: [["What", "A work, life and organization app"], ["For", "Witchy, spiritual women who want to feel powerful"], ["How", "Gamifies to-dos and daily routines with AI"], ["Status", "Invitation-only for now"]],
        more: "<p>I built it for myself. It turns to-dos and daily routines into a game, with AI.</p>" },
      { name: "52 Saturdays", preview: "fiftytwo/index.html", one: "An inspiration book with one intentional adventure for every Saturday of the year.",
        pics: [["assets/proj/sat-cover.jpg", "52 Saturdays book cover: a dad walking with his two kids"], ["assets/proj/sat-philosophy.webp", "Fatherhood is your life's work. The belief: fatherhood is worthy of ambition. The purpose: raise children who know they are deeply loved and wildly capable."]],
        facts: [["What", "An inspiration book for dads"], ["My role", "Manager and editor"], ["Also", "Built the Best Case Scenario brand"]],
        more: "<p>It challenges dads to treat parenthood as their biggest goal yet.<br>I manage and edit it for its author and built the Best Case Scenario brand around it.</p><div class=\"look\"><b>What I'm looking for</b><ul><li>A literary agent or publisher</li><li>Outdoor and apparel brand partners</li><li>Dads willing to read early chapters</li></ul></div><a class=\"ext\" href=\"fiftytwo/index.html\" data-full=\"52 Saturdays\">See the 52 Saturdays site ↗</a>" },
      { name: "The Coven", preview: "coven/section.dc.html", noDetails: true, one: "An invite-only marketplace for energy healers, tarot readers, herbalists and makers, by and for women." },
      { name: "Draper Real Estate", one: "Brand and website for Draper Real Estate, a Houston Heights realtor.",
        logo: "assets/proj/draper-logo.webp",
        pics: [["assets/proj/draper-door-white.jpg", ""], ["assets/proj/draper-logo.webp", "Draper Real Estate"], ["assets/proj/heights-logo.webp", "Living in the Heights logo"], ["assets/proj/heights-icon.webp", "Houston Heights illustration"]],
        facts: [["What", "Brand and website"], ["For", "Draper Real Estate, a Houston Heights realtor"], ["Also building", "Living in the Heights"]],
        more: "<p>Alongside it we're building Living in the Heights.<br>It's a community website and magazine for the Greater Heights: local stories, places, events and people.</p><div class=\"look\"><b>What I'm looking for</b><ul><li>Local writers, photographers and storytellers</li><li>Heights businesses and event organizers</li><li>Neighborhood sponsors</li></ul></div><a class=\"ext\" href=\"https://claude.ai/artifact/4dzPKfurLPFXjVcRsAtcaZ\" target=\"_blank\" rel=\"noopener noreferrer\">See the Draper site ↗</a>" }
    ],
    cta: true
  }
};

/* the koi pond, drawn as a little animated picture */
var KOI_SVG = '<svg viewBox="0 0 600 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%"><defs><radialGradient id="koiWater" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#3fb3a6"/><stop offset=".6" stop-color="#1f7f78"/><stop offset="1" stop-color="#11524e"/></radialGradient>'
 + '<g id="koiA"><path d="M-46 0 C-30 -20 22 -20 40 0 C22 20 -30 20 -46 0Z" fill="#fbf2e6"/><path d="M-20 -12 C-6 -18 10 -14 16 -4 C4 0 -12 -2 -20 -12Z" fill="#f2702a"/><path d="M6 6 C14 4 24 6 30 2 C24 12 12 14 6 6Z" fill="#f2702a"/><path d="M-44 0 L-70 -16 L-62 0 L-70 16Z" fill="#fbf2e6" opacity=".9"/></g>'
 + '<g id="koiB"><path d="M-46 0 C-30 -20 22 -20 40 0 C22 20 -30 20 -46 0Z" fill="#f2702a"/><path d="M-8 -14 C4 -16 16 -10 20 -2 C8 0 -2 -4 -8 -14Z" fill="#15302c"/><path d="M-44 0 L-70 -16 L-62 0 L-70 16Z" fill="#f2702a" opacity=".9"/></g>'
 + '<g id="koiC"><path d="M-40 0 C-26 -17 20 -17 34 0 C20 17 -26 17 -40 0Z" fill="#ec2b7a"/><path d="M-14 -10 C0 -14 12 -10 16 -2 C4 2 -6 0 -14 -10Z" fill="#fbf2e6"/><path d="M-38 0 L-60 -14 L-53 0 L-60 14Z" fill="#ec2b7a" opacity=".9"/></g></defs>'
 + '<rect width="600" height="480" fill="url(#koiWater)"/><g fill="none" stroke="#bfe9e2" stroke-opacity=".35" stroke-width="2"><circle cx="150" cy="120" r="30"/><circle cx="150" cy="120" r="52" stroke-opacity=".18"/><circle cx="470" cy="360" r="24"/><circle cx="470" cy="360" r="44" stroke-opacity=".18"/></g>'
 + '<g style="transform-origin:300px 240px;animation:koiSwim 26s linear infinite"><use href="#koiA" transform="translate(300 90)"/></g>'
 + '<g style="transform-origin:300px 240px;animation:koiSwim 19s linear infinite reverse"><use href="#koiB" transform="translate(300 150) rotate(180)"/></g>'
 + '<g style="transform-origin:300px 240px;animation:koiSwim 33s linear infinite"><use href="#koiC" transform="translate(300 60)"/></g>'
 + '<g><circle cx="90" cy="380" r="46" fill="#2e8a4e"/><path d="M90 380 L136 372 L130 392Z" fill="#11524e"/><circle cx="520" cy="96" r="38" fill="#3a9a57"/><path d="M520 96 L556 84 L558 104Z" fill="#11524e"/><circle cx="545" cy="150" r="22" fill="#2e8a4e"/><circle cx="96" cy="370" r="10" fill="#f6b3c8"/><circle cx="96" cy="370" r="4" fill="#eda12b"/></g></svg>';

/* paintings: frame is the frame style shown on the lawn */
var ART = [
  { src: "assets/art/whimsical-colorful-dog-portrait.webp", t: "Dog portrait", a: "Painted dog portrait in bright stripes" },
  { src: "assets/art/psychedelic-roses-and-neon-butterflies.webp", t: "Roses and neon butterflies", a: "Red roses with neon blue butterflies", frame: "lime" },
  { src: "assets/art/vivid-layered-garden-collage.webp", t: "Layered garden collage", a: "Layered collage of roses, a red barn and a garden", frame: "blush" },
  { src: "assets/art/neon-butterfly-face-geometry.webp", t: "Neon butterfly geometry", a: "Geometric painting with a blue butterfly", frame: "oval" },
  { src: "assets/art/red-raincoat-duck-in-a-sunset-meadow.webp", t: "Duck in a red raincoat", a: "Duck in a red raincoat in a sunset meadow", frame: "blush" },
  { src: "assets/art/whimsical-orange-cat-floral-mural.webp", t: "Orange cat", a: "Orange cat surrounded by flowers", frame: "lime" },
  { src: "assets/art/vivid-circuitry-bunny-painting.webp", t: "Circuitry bunny", a: "Blue bunny painted with circuit-like lines", frame: "oval" },
  { src: "assets/art/vibrant-woman-in-a-whimsical-floral-landscape.webp", t: "Woman in a floral landscape", a: "Woman with flowing pink hair in a field of flowers" },
  { src: "assets/art/whimsical-keyhole-garden-painting.webp", t: "Keyhole garden", a: "A tiny bedroom and garden inside a keyhole", frame: "lime" },
  { src: "assets/art/vibrant-impasto-floral-yin-yang-canvas.webp", t: "Floral yin yang", a: "Pink yin yang ringed with textured roses", frame: "blush" }
];
var FRAMES = { lime: "assets/proj/frame-lime-orig.webp", blush: "assets/proj/frame-blush-orig.webp", oval: "assets/proj/frame-oval-orig.webp", pink: "assets/proj/pink-frame-orig.webp" };
