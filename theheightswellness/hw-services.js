(function () {
  var B = 'https://images.squarespace-cdn.com/content/v1/69f26965f185f144397b5ad8/';
  var img = function (p) { return B + p + '?format=1500w'; };
  window.HW_IMG = img;
  window.HW_ICONS = {
    'iv': ['M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z'],
    'peptides': ['m18 2 4 4', 'm17 7 3-3', 'M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5', 'm9 11 4 4', 'm5 19-3 3', 'm14 4 6 6'],
    'nad': ['M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z'],
    'vitamins': ['m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z', 'm8.5 8.5 7 7'],
    'red-light': ['M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8', 'M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'],
    'pelvic-floor': ['M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'],
    'body-sculpting': ['M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20', 'M12 6a6 6 0 1 0 0 12 6 6 0 1 0 0-12', 'M12 10a2 2 0 1 0 0 4 2 2 0 1 0 0-4'],
    'aesthetics': ['M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z', 'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12']
  };
  window.HW_GRADS = ['linear-gradient(135deg,var(--peach),var(--blush))', 'linear-gradient(135deg,var(--sky),var(--lav))', 'linear-gradient(135deg,var(--sage),var(--sky))', 'linear-gradient(135deg,var(--blush),var(--lav))', 'linear-gradient(135deg,var(--peach),var(--sage))'];
  window.HW_SERVICES = [
    {
      slug: 'iv', name: 'IV Therapy', script: 'Therapy', tagline: 'Hydration and nutrients, delivered directly.',
      hero: img('c6b3f539-e219-4e94-8d6a-ca5210348794/5S9A2447.JPEG'), alt: img('ce604651-fb09-45f3-b429-325aa51a8578/5S9A2431.JPEG'),
      what: 'IV therapy delivers fluids, vitamins and electrolytes through a small intravenous line. Each drip is selected with you at your visit, and you settle into a quiet lounge chair while it runs.',
      who: 'Adults looking for hydration and recovery support, whether you are traveling, training, recovering from a long week or preparing for an event. A short health screening is completed before your first drip.',
      expect: ['A brief health screening and conversation about your goals', 'Your drip is prepared and placed by our clinical team', 'Relax in the lounge while it runs, usually 45–60 minutes', 'Return to your day right after'],
      menuTitle: 'The drip menu',
      menu: [['Hydration', 'Fluids and electrolytes'], ["Myers' Cocktail", 'A classic vitamin and mineral blend'], ['Recovery', 'For after a late night or a hard week'], ['Performance', 'For athletes and active schedules'], ['Glow', 'A beauty-focused blend'], ['Add-ons', 'Boosters added to any drip']],
      time: '45–60 minutes', price: 'Memberships from $99', priceLink: true,
      note: 'Every drip is reviewed for suitability before treatment. Not every option is right for every person.'
    },
    {
      slug: 'peptides', name: 'Peptide Therapy', script: 'Therapy', tagline: 'Guided protocols, built around your goals.',
      hero: img('92218757-c354-429a-95a0-4326b89781ee/5S9A2598.JPEG'), alt: img('2dfa8a10-683e-42b9-b68a-1dde7ccb919e/5S9A2599%2B2.JPEG'),
      what: 'Peptides are short chains of amino acids. Peptide therapy at Heights is offered only after a consultation, and any protocol is determined and supervised by our clinical team.',
      who: 'Adults interested in a guided, ongoing plan. Eligibility is determined at consultation; some peptides are not appropriate for everyone.',
      expect: ['Consultation and health history review', 'Our clinical team determines whether a protocol is appropriate', 'If eligible, you receive a personalized plan', 'Regular check-ins throughout'],
      menuTitle: 'Peptides we discuss at consultation',
      menu: [['Wolverine Blend', 'BPC-157 / TB-500'], ['Glow Peptide', 'GHK-Cu'], ['CJC / Ipamorelin', ''], ['Selank', ''], ['Semax', ''], ['AOD-9604', ''], ['Tesamorelin', ''], ['MOTS-C', ''], ['Melanotan II', ''], ['PT-141', '']],
      time: 'Consultation, then an ongoing protocol', price: 'Priced at consultation',
      note: 'Consultation required. Availability, eligibility and protocols are determined by our clinical team. Some peptides are investigational and are not approved for all uses.'
    },
    {
      slug: 'nad', name: 'NAD+ Therapy', script: 'Therapy', tagline: 'A slower, restorative infusion.',
      hero: img('d8e5a605-0b97-4928-8c6a-6cdb3b20ce59/5S9A2504.JPEG'), alt: img('3a22efad-ddcd-4cd7-8060-a6a404daf95c/5S9A2385.JPEG'),
      what: 'NAD+ is a coenzyme found in every cell of the body. NAD+ therapy is given as a slow infusion in our treatment lounge, with the pace adjusted to your comfort.',
      who: 'Adults who have completed a health screening with our team. We will talk through whether NAD+ is a good fit before booking.',
      expect: ['Screening and consultation', 'A slow, monitored infusion in a private lounge chair', 'Time to rest, read or work quietly', 'Aftercare guidance from our team'],
      menuTitle: '', menu: [],
      time: 'Varies with infusion pace', price: 'Priced at consultation',
      note: 'NAD+ therapy requires clinical review before treatment.'
    },
    {
      slug: 'vitamins', name: 'Vitamin Boosts', script: 'Boosts', tagline: 'A quick shot of support.',
      hero: img('c877b91c-292b-4efa-8a66-505efa529d5d/5S9A2483.JPEG'), alt: img('1cf53ea7-2985-46ba-9f27-b4f423c65afd/5S9A2404.JPEG'),
      what: 'Single-dose injections that take only a few minutes. Boosts can be booked on their own or added to an IV or red light visit.',
      who: 'Adults looking for a fast add-on to their routine. A short screening is completed before your first boost.',
      expect: ['Choose your boost with our team', 'A quick injection', 'In and out in about 10–15 minutes'],
      menuTitle: 'The boost menu',
      menu: [['B12', ''], ['Glutathione', ''], ['Vitamin C', ''], ['Vitamin D', ''], ['L-Carnitine', ''], ['MIC', '']],
      time: '10–15 minutes', price: 'Priced per boost',
      note: 'Our full menu is confirmed at your visit. Some options require a consultation.'
    },
    {
      slug: 'red-light', name: 'Red Light Therapy', script: 'Therapy', tagline: 'A quiet session under the light.',
      hero: img('aa880cb8-20fa-40f1-9ea4-9f820d649cfc/5S9A2525.JPEG'), alt: img('0c2b5435-f13b-4661-913b-34c9d1db4189/cf839cfc9328bf14d9b2f89ec3663843.jpg'),
      what: 'Red light therapy uses red and near-infrared light in a private studio session. You lie back, close your eyes and rest while the session runs.',
      who: 'Adults interested in skin, recovery or simply a calm reset. Let us know about any light sensitivity or medications before your first session.',
      expect: ['A short intake on your first visit', 'Settle in under the panel', 'A 15–20 minute session', 'Pair it with a boost or IV if you like'],
      menuTitle: '', menu: [],
      time: '15–20 minutes', price: 'Single sessions and packages',
      note: 'Results vary by person. Our team will help you choose a session cadence.'
    },
    {
      slug: 'pelvic-floor', name: 'Pelvic Floor Therapy', script: 'Therapy', tagline: 'Strength and confidence, from the core.',
      hero: img('45fbdf99-d4b8-4362-9577-870337e0aabd/5S9A2566.JPEG'), alt: img('e26629d8-8274-4aa0-b116-385ff72fd3b9/5S9A2562.JPEG'),
      what: 'A non-invasive treatment chair that works the pelvic floor muscles while you sit fully clothed. Private, comfortable and quick.',
      who: 'Adults wanting pelvic floor support, including after pregnancy. We review your history at consultation.',
      expect: ['Consultation to confirm the treatment is right for you', 'Sit fully clothed in the treatment chair', 'About 30 minutes per session', 'Usually booked as a series'],
      menuTitle: '', menu: [],
      time: 'About 30 minutes', price: 'Single sessions and series',
      note: 'Not suitable for everyone. Please share any implants, pregnancy or medical devices before treatment.'
    },
    {
      slug: 'body-sculpting', name: 'Body Sculpting', script: 'Sculpting', tagline: 'Non-invasive contouring with RenaSculpt.',
      hero: img('fad1f7e4-8b24-492b-a3e5-b259829471c7/5S9A2553.JPEG'), alt: img('df1ea5b2-b4ac-4342-a4c2-d25e97e36a6d/5S9A2584.JPEG'),
      what: 'RenaSculpt is a non-invasive body contouring device. Sessions are done in our studio with no downtime, so you can go straight back to your day.',
      who: 'Adults looking for non-invasive contouring, including postpartum clients. We review your goals and history first.',
      expect: ['Consultation and treatment plan', 'Applicators placed on the treatment area', 'Relax while the session runs', 'Usually booked as a series'],
      menuTitle: '', menu: [],
      time: 'Varies by area', price: 'Priced by treatment plan',
      note: 'Individual results vary. Our team will set realistic expectations at consultation.'
    },
    {
      slug: 'aesthetics', name: 'Aesthetics', script: 'Aesthetics', tagline: 'Natural-looking refinement.',
      hero: img('574f5827-a489-4466-8292-67e5cf0307b5/5S9A2548.JPEG'), alt: img('8fd1dd5e-7fb3-4d53-ab1e-d46773c66cea/5S9A2643.JPEG'),
      what: 'Botox and aesthetic injectables, performed by our clinical team with a focus on subtle, natural-looking results.',
      who: 'Adults considering injectables for the first time or continuing an existing routine. Every treatment starts with a consultation.',
      expect: ['Consultation and facial assessment', 'Treatment plan agreed together', 'Treatment in a private room', 'Follow-up guidance'],
      menuTitle: 'Offered', menu: [['Botox', 'Neuromodulator treatment']],
      time: 'About 30 minutes', price: 'Priced per treatment',
      note: 'Consultation required. Treatment is performed only when clinically appropriate.'
    }
  ];
})();
