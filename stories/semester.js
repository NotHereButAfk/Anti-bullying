/* Authored scenes: conditions and effects are data, not live AI-generated text. */
(function (root) {
  'use strict';
  const scenes = {};
  const p = (text, when) => ({ text, when });
  const d = (speaker, text, when) => ({ speaker, text, when });
  const f = flag => ({ flag });
  const not = flag => ({ not: f(flag) });
  const role = value => ({ profile: 'role', value });
  const any = (...conditions) => ({ any: conditions });
  const c = (id, label, next, effect = {}, when, note) => ({ id, label, next, effect, when, note });
  const m = (who, tag, text) => ({ who, tag, text });
  function add(id, chapter, title, place, text, choices, extra = {}) {
    scenes[id] = { chapter, title, place, text, choices, ...extra };
  }
  const roleNext = [
    { when: role('target'), next: 'target_intro' },
    { when: role('former'), next: 'repair_intro' },
    { next: 'witness_intro' }
  ];
  const homeNext = [
    { when: { profile: 'support', value: 'friend' }, next: 'home_friend' },
    { when: { profile: 'support', value: 'sibling' }, next: 'home_sibling' },
    { next: 'home_new' }
  ];
  const conflictNext = ['rumors', 'online', 'exclusion', 'intimidation'].map(value => ({
    when: { profile: 'conflict', value }, next: 'incident_' + value
  }));
  const clubNext = ['art', 'games', 'sports', 'music'].map(value => ({
    when: { profile: 'interest', value }, next: 'club_' + value
  }));
  const routeNext = [
    { when: { route: 'support' }, next: 'c4_support' },
    { when: { route: 'community' }, next: 'c4_event' },
    { when: { route: 'repair' }, next: 'c4_riley' },
    { next: 'c4_quiet' }
  ];
  const nextWithPromise = [
    { when: [f('promised'), f('promise_kept')], next: 'c4_kept' },
    { when: f('promised'), next: 'c4_missed' },
    ...routeNext
  ];
  const reportEffect = {
    flags: { reported: true }, route: 'support',
    memories: [m('chen', 'report', 'You asked for a concrete response and a follow-up date.')],
    queue: [{ id: 'adult_followup', after: 2,
      text: 'Ms. Chen leaves a private message: your report is logged, and a follow-up appointment is reserved. You do not need new evidence to attend.',
      effect: { flags: { followup_ready: true }, facts: ['A private school follow-up has been scheduled.'] } }]
  };
  const harmEffect = {
    flags: { harm: true }, relationships: { morgan: -12, riley: 5 },
    memories: [m('morgan', 'amplified', 'You repeated the harmful claim instead of checking it.')]
  };

  // CHAPTER ONE — Different places and perspectives produce different openings.
  add('open_city', 1, 'A city full of first days', 'Transit stop · Monday', [
    p('The train doors close behind you. Outside, delivery bikes thread through traffic and the windows of {{school}} catch the morning sun. You have the address, a half-charged phone, and a timetable that seems to put two classrooms on the same floor twice.'),
    p('At the entrance, Jules is collecting loose timetable pages before they blow into the street. A student you have not met points toward a side gate. The main office is visible through the glass; so is a quiet room marked Student Support.'),
    d('Jules', 'First day? There are three staircases. Only one gets you to science without a detour.'),
    p('You have a few minutes before the bell. How you use them can give you a familiar face or a useful place to return to.')
  ], [
    c('help', 'Help Jules collect the papers and ask for directions.', roleNext, {
      relationships: { jules: 10 }, memories: [m('jules', 'first_day', 'You stopped to help at the school entrance.')]
    }),
    c('orient', 'Visit the main office and find the support room.', roleNext, {
      flags: { knows_office: true }, facts: ['The support room is beside the main office.']
    })
  ]);
  add('open_suburb', 1, 'Between two bus stops', 'School entrance · Monday', [
    p('The bus leaves you beside a field still wet with dew. At {{school}}, students collect in groups that seem to have existed forever. A poster advertises a showcase, a coding club, and a team looking for another volunteer.'),
    p('Sam is trying to tape the poster straight while balancing a stack of folders. Through the entrance, an attendance clerk is giving a new student a map. You can already hear the first warning bell.'),
    d('Sam', 'Could you hold this corner? Everything looks more official when it is not falling off the wall.'),
    p('You do not have to decide who you will be for the whole semester. You only have to decide where to go first.')
  ], [
    c('help', 'Hold the poster and introduce yourself to Sam.', roleNext, {
      relationships: { sam: 10 }, memories: [m('sam', 'first_day', 'You helped put up the first showcase poster.')]
    }),
    c('map', 'Get a map and mark somewhere quiet for lunch.', roleNext, {
      flags: { quiet_place: true }, stats: { energy: 5 }, facts: ['The library has a quiet lunch area.']
    })
  ]);
  add('open_town', 1, 'Everybody knows a version', 'Main street · Monday', [
    p('A bus passes the bakery and stops outside {{school}}. The crossing guard recognizes nearly everyone. People finish conversations that began last week; you are still learning which door is the entrance.'),
    p('Jules is beside the community noticeboard, taking down a rain-damaged flyer. Someone waves from across the street and asks whether you are the new student. It is friendly, but it is also a reminder of how quickly a name can travel here.'),
    d('Jules', 'The noticeboard is more useful than the website. The library hours are here, and the school counselor has a drop-in time.'),
    p('Familiarity can provide support or make a rumor harder to escape. Neither outcome is decided yet.')
  ], [
    c('talk', 'Introduce yourself to Jules rather than guessing what people know.', roleNext, {
      relationships: { jules: 10 }, memories: [m('jules', 'first_day', 'You introduced yourself at the community noticeboard.')]
    }),
    c('note', 'Make a note of the library and counselor hours.', roleNext, {
      flags: { knows_office: true }, facts: ['You noted the counselor’s drop-in hours.']
    })
  ]);
  add('open_academy', 1, 'The work on the walls', 'Gallery corridor · Monday', [
    p('At {{school}}, the corridor doubles as a gallery. There are painted portraits, a half-built stage model, and a game controller attached to a student project. Somebody is practicing the same four piano notes behind a closed door.'),
    p('Morgan stands on a low step, adjusting a label beneath a drawing. Beside the door, a program explains where to find the main office and a quiet practice room. You slow down without quite meaning to.'),
    d('Morgan', 'It looks different with a name underneath. Sometimes I wish people could look at the work first.'),
    p('A school full of personal work also needs rules about who gets to share it. That question will return later.')
  ], [
    c('ask', 'Ask what Morgan likes about the drawing, without photographing it.', roleNext, {
      relationships: { morgan: 8 }, memories: [m('morgan', 'first_day', 'You asked about the work rather than taking a picture.')]
    }),
    c('map', 'Study the program and find the quiet practice room.', roleNext, {
      flags: { quiet_place: true }, stats: { energy: 5 }, facts: ['You found a quiet practice room.']
    })
  ]);
  add('target_intro', 1, 'Your name in somebody else’s sentence', 'Form room · Monday', [
    p('You hear your name before you reach your desk. Riley stops speaking as you sit down. Two students exchange a look. Nothing about that moment gives you the whole story, but it is enough to make the room feel less ordinary.'),
    d('Morgan', 'You can sit here. You do not have to explain anything.'),
    p('The teacher begins taking attendance. You cannot control what Riley says later, and you do not have to prove you are confident enough to deserve respect. For now, there is an empty seat, a library pass, and the name of a counselor on your timetable.'),
    p('Choose where you want your next conversation to happen.')
  ], [
    c('morgan', 'Accept Morgan’s company and meet in the library.', 'c1_library', { relationships: { morgan: 8 } }),
    c('adult', 'Ask to speak privately with Ms. Chen.', 'c1_adviser', { flags: { wants_support: true } }),
    c('space', 'Take a break in the courtyard before deciding.', 'c1_courtyard', { stats: { energy: 5 } })
  ]);
  add('witness_intro', 1, 'The laugh that stops', 'Form room · Monday', [
    p('Riley is repeating something about Morgan just loudly enough for the next desk to hear. A few students laugh. Morgan turns a notebook face down and concentrates on a blank part of the timetable.'),
    p('Riley looks toward you, waiting for a reaction. The teacher is talking to someone at the door. You could help without performing for the whole room; you could ask an adult to notice what they missed.'),
    d('Jules', 'I never know whether saying something makes it worse. But pretending not to see it does not feel right either.'),
    p('Morgan is a person with preferences, not a mission you have been assigned. Your next step can leave room for those preferences.')
  ], [
    c('morgan', 'Offer Morgan company and ask whether the library would be okay.', 'c1_library', { relationships: { morgan: 8 } }),
    c('adult', 'Speak privately with Ms. Chen about what you witnessed.', 'c1_adviser'),
    c('riley', 'Find out what Riley says when there is no audience.', 'c1_courtyard')
  ]);
  add('repair_intro', 1, 'You were in the photograph, too', 'Form room · Monday', [
    p('Last term you helped Riley circulate an embarrassing picture of Morgan. You were not the only person involved. That does not make your part disappear. When Morgan sees you at the classroom door, they move their bag onto the empty chair.'),
    d('Riley', 'New term. Can we stop being dramatic about old stuff?'),
    p('You used to like how easy it was to belong beside Riley. Now the same sentence sounds like permission to repeat something you regret. An apology could be a start, but it cannot demand a seat or an answer in return.'),
    p('You can look for guidance, ask whether Morgan wants a conversation, or begin by changing your behavior around Riley.')
  ], [
    c('ask', 'Ask once whether Morgan would talk in the library; accept a no.', 'c1_library', { flags: { asked_consent: true } }),
    c('guidance', 'Ask Ms. Chen how to take responsibility without adding pressure.', 'c1_adviser'),
    c('riley', 'Speak to Riley away from the group.', 'c1_courtyard')
  ]);
  add('c1_library', 1, 'A conversation with an exit', 'Library · Monday lunch', [
    p('The library is quieter than the corridor, but not silent. A printer coughs out pages. Morgan chooses a chair nearest the aisle, with enough space to leave whenever they want.'),
    d('Morgan', 'I would rather not have a big scene made out of everything. Sometimes I just want to draw.'),
    p('You remember knowing Morgan before this term. Familiarity does not mean you already know what they need today.', { profile: 'support', value: 'friend' }),
    d('Morgan', 'And I am not ready to say we are fine. I can listen for a minute.', role('former')),
    p('You can offer company without turning it into a promise to fix everything. Outside the window, the lunch crowd thins. There is still time to get to class.')
  ], [
    c('listen', 'Listen, and ask before sharing anything from this conversation.', homeNext, {
      flags: { privacy: true }, relationships: { morgan: 12 },
      memories: [m('morgan', 'listened', 'You listened privately and agreed not to make their story public.')]
    }),
    c('ordinary', 'Talk about drawing and let the difficult subject rest.', homeNext, {
      relationships: { morgan: 8 }, stats: { energy: 5 },
      memories: [m('morgan', 'ordinary', 'You made room for an ordinary conversation, not only the problem.')]
    }),
    c('space', 'Thank Morgan and respect their wish for space.', homeNext, {
      flags: { respects_space: true }, memories: [m('morgan', 'space', 'You accepted that a conversation could end without an answer.')]
    })
  ]);
  add('c1_courtyard', 1, 'Without an audience', 'Courtyard · Monday lunch', [
    p('A basketball rolls across the courtyard and stops beside a bench. Riley retrieves it, then sits with the ball held between their shoes. Without the group around, the performance is less polished.'),
    d('Riley', 'People act like I am the only person who ever makes a joke.'),
    p('You do not need to diagnose Riley or find a secret reason that excuses the behavior. You can describe what happened, decline the conversation, or ask for an adult to help. Their response is their responsibility.'),
    p('You notice a second bench near the library doors. Taking space remains an option even when someone wants an argument.')
  ], [
    c('boundary', '“People laughing does not make it harmless. I am not joining in.”', homeNext, {
      flags: { boundary: true }, stats: { voice: 6 },
      memories: [m('riley', 'boundary', 'You declined to help turn another student into a joke.')]
    }),
    c('leave', 'Leave the debate and spend lunch somewhere quieter.', homeNext, {
      stats: { energy: 7 }, flags: { quiet_place: true }
    }),
    c('adult', 'Say that a staff member should help address the behavior.', homeNext, {
      flags: { wants_support: true }, memories: [m('riley', 'adult_boundary', 'You asked for adult involvement rather than a public argument.')]
    })
  ]);
  add('c1_adviser', 1, 'The chair by the window', 'Student support · Monday lunch', [
    p('Ms. Chen closes the outer door, leaving the inner office visible through a glass panel. She offers a choice of chairs and asks what you want her to know before she starts taking notes.'),
    d('Ms. Chen', 'You can begin with what happened, or with what would make tomorrow easier. You do not need a complete case file to ask for help.'),
    p('She explains that immediate safety concerns may require her to involve other staff, and that she will explain what she can about the next steps. This is not a promise that everything stays secret or gets fixed today.'),
    d('Ms. Chen', 'What would you like us to do first?')
  ], [
    c('plan', 'Identify a safe place, a contact person, and a follow-up time.', homeNext, {
      flags: { safety_plan: true }, relationships: { chen: 12 },
      memories: [m('chen', 'first_plan', 'You made a practical plan for where to go and whom to contact.')],
      facts: ['A safe contact and a quiet place are available.']
    }),
    c('listen', 'Ask her to listen before choosing any next steps.', homeNext, {
      relationships: { chen: 8 }, stats: { energy: 5 },
      memories: [m('chen', 'listen_first', 'You asked to be heard before deciding what to do.')]
    }),
    c('responsibility', 'Ask how to take responsibility for your own harmful actions.', homeNext, {
      flags: { wants_repair: true }, relationships: { chen: 8 }
    }, role('former'))
  ]);
  add('home_friend', 1, 'An old thread', 'Home · Monday evening', [
    p('At home, an old message thread with Morgan is still pinned above the school chat. There are pictures of unfinished projects and a debate about the best snack for a long bus ride. Neither of you used to need a reason to message.'),
    d('Morgan', 'We can talk about something else tonight. Or not talk. I just wanted you to know I saw your message.'),
    p('Friendship is not an automatic pass into someone else’s private life. It can also be the place where you admit you do not have a solution. You set the phone down beside tomorrow’s timetable.'),
    p('What would make this evening a little more manageable?')
  ], [
    c('connect', 'Send an ordinary, low-pressure message back.', conflictNext, {
      relationships: { morgan: 5 }, memories: [m('morgan', 'home_checkin', 'You kept a connection without demanding a serious conversation.')]
    }),
    c('rest', 'Mute the group chat and return to a favorite activity.', conflictNext, { stats: { energy: 10 }, flags: { took_break: true } })
  ]);
  add('home_sibling', 1, 'Avery notices', 'Home · Monday evening', [
    p('Your older sibling Avery is making toast when you come in. They ask about a teacher you have not met yet, then stop when you do not answer immediately. The kettle clicks off between you.'),
    d('Avery', 'Do you want advice, company, or for me to stop asking questions?'),
    p('They know the building better than you, but they do not know everything happening inside it. You can ask for a walk to school or help finding an adult without making them responsible for confronting Riley.'),
    p('Tomorrow’s timetable is folded in your pocket. You take it out and smooth the crease.')
  ], [
    c('tell', 'Explain what happened and ask Avery to walk with you tomorrow.', conflictNext, {
      flags: { home_support: true }, stats: { energy: 7 }, facts: ['Avery offered company on the way to school.']
    }),
    c('company', 'Ask for company without discussing every detail.', conflictNext, { flags: { home_support: true }, stats: { energy: 8 } })
  ]);
  add('home_new', 1, 'A room of your own', 'Home · Monday evening', [
    p('The timetable looks different spread across your own desk. At school, everybody seemed to know where to stand and whom to greet. Here you can take a breath without worrying about who sees it.'),
    p('The welcome email lists a counselor, a year adviser, and a quiet lunchtime space. None of them requires you to already have friends. You also have room in your notebook for a few facts about what happened, if writing would help.'),
    p('You are not failing at being new. A first day is incomplete information, not a verdict on the rest of the semester.'),
    p('Before tomorrow, choose one thing that belongs to you rather than to the group chat.')
  ], [
    c('write', 'Write a private note and save the support contact.', conflictNext, {
      flags: { knows_office: true }, facts: ['You saved a support contact and a private first-day note.']
    }),
    c('rest', 'Set the timetable aside and spend time on {{interest}}.', conflictNext, { stats: { energy: 10 }, flags: { took_break: true } })
  ]);

  // CHAPTER TWO — Four specific conflicts, with evidence optional rather than a price of admission.
  add('incident_rumors', 2, 'A story nobody checked', 'Corridor · Wednesday', [
    p('The rumor has acquired details since Monday. Somebody says {{subject}} cheated on an assignment; somebody else claims a teacher confirmed it. No one can name that teacher. Riley presents the uncertainty as proof that something must have happened.'),
    d('Jules', 'I heard it from a different person. That does not mean they knew either.'),
    p('There is a difference between checking what was actually said and interrogating the person being targeted. Repeating the rumor in a bigger group would spread it further, even with a question mark attached.'),
    p('A classroom door opens. You have an opportunity to seek a quieter conversation rather than let the corridor decide the facts.')
  ], [
    c('check', 'Ask Jules what they personally witnessed, without repeating the claim.', 'rumor_check'),
    c('private', 'Move the conversation somewhere private.', 'c2_private'),
    c('support', 'Ask a staff member to help stop the rumor.', 'c2_report'),
    c('repeat', 'Repeat the claim to fit in with Riley.', 'c2_harm', harmEffect, { not: role('target') })
  ]);
  add('incident_online', 2, 'A notification after midnight', 'Class chat · Wednesday', [
    p('An edited picture of {{subject}} appears in the class chat. The caption is designed to get a laugh. By morning there are replies from people who were not even in the original conversation.'),
    p('The image is not displayed in the game. The important fact is that someone’s image was used to humiliate them without permission.'),
    d('Sam', 'I was going to tell everyone it was fake, but that would mean posting it again. I stopped.'),
    p('You can preserve the message information privately, use reporting tools, step away, or seek help. You do not need to keep looking at the picture to prove it was harmful.')
  ], [
    c('evidence', 'Record the message details privately; do not redistribute the image.', 'online_evidence'),
    c('mute', 'Mute the thread and talk to someone supportive.', 'c2_private', { stats: { energy: 5 } }),
    c('support', 'Ask a trusted adult for help with the harassment.', 'c2_report'),
    c('forward', 'Forward the message to another group.', 'c2_harm', harmEffect, { not: role('target') })
  ]);
  add('incident_exclusion', 2, 'A name missing from the list', 'Club noticeboard · Wednesday', [
    p('The showcase planning list has been updated. {{subject}} is missing, although their signup was accepted last week. Riley says the group is full. There are still blank spaces at the bottom of the page.'),
    d('Sam', 'I did not approve that change. I can check the earlier signup sheet.'),
    p('A quieter lunch or a different club might help someone get through the day. That does not make exclusion their responsibility to solve. The organizer can address the rule and the people changing it.'),
    p('You can ask about the roster without making the affected student stand in front of everyone and argue for a place.')
  ], [
    c('roster', 'Compare the signup sheets with Sam privately.', 'exclusion_roster'),
    c('private', 'Ask what support the affected student wants.', 'c2_private'),
    c('boundary', 'Tell the organizer the participation rules need to be applied fairly.', 'c2_boundary'),
    c('agree', 'Agree with Riley that leaving someone out is easier.', 'c2_harm', harmEffect, { not: role('target') })
  ]);
  add('incident_intimidation', 2, 'The route you should not have to change', 'Stairwell · Wednesday', [
    p('Near the stairwell, Riley blocks the way and makes a threatening remark toward {{subject}}. The remark is not repeated here. The threat, not anyone’s reaction to it, is the problem.'),
    p('A supervised classroom is open nearby. You do not need to prove bravery by staying in the confrontation, recording it at close range, or answering the threat.'),
    d('Jules', 'The teacher is right there. Let us go to that room.'),
    p('This part of the story contains no combat encounter. Getting to a safer place and involving a responsible adult remain available without any confidence requirement.')
  ], [
    c('safe', 'Move toward the supervised classroom.', 'threat_safe', { flags: { sought_safety: true } }),
    c('adult', 'Get the nearby teacher’s attention and ask for help.', 'c2_report', { flags: { sought_safety: true } })
  ]);
  add('rumor_check', 2, 'What a witness actually knows', 'Library doorway · Wednesday', [
    d('Jules', 'I heard Riley say a teacher had confirmed it. I did not hear a teacher say anything.'),
    p('That distinction is useful. It is not a complete investigation, and you do not try to make it one. Jules agrees that you can write down what they personally heard, but not turn them into the subject of a public callout.'),
    p('You note the place and approximate time. If you pass the note to staff, it will say what was witnessed, not pretend the rumor itself is true.'),
    p('Jules seems relieved that you did not ask them to pick a side in front of everyone.')
  ], [
    c('record', 'Keep a factual, private note with Jules’s permission.', 'c2_record', {
      flags: { documented: true }, relationships: { jules: 8 },
      facts: ['Jules heard Riley repeat the rumor; no teacher confirmation was witnessed.'],
      memories: [m('jules', 'accurate', 'You distinguished what Jules saw from what other people claimed.')]
    }),
    c('respect', 'Respect the limits of what Jules knows and seek support anyway.', 'c2_report', {
      relationships: { jules: 6 }, memories: [m('jules', 'no_pressure', 'You did not pressure Jules to claim more than they knew.')]
    })
  ]);
  add('online_evidence', 2, 'A record, not a repost', 'Library computer area · Wednesday', [
    p('You write down where the message appeared and when. The image does not go into a public folder or a new group chat. A report should not become another distribution channel.'),
    d('Sam', 'I can tell a teacher where I saw it. I do not need to show it to more students.'),
    p('The school’s reporting page offers a private contact. You can include the record you have, or contact someone directly without attaching anything. Neither choice requires you to keep watching the discussion.'),
    p('You close the chat preview. The rest of the screen looks almost unexpectedly ordinary.')
  ], [
    c('record', 'Save the record for a private report.', 'c2_record', {
      flags: { documented: true }, facts: ['The original chat location and message time are recorded privately.']
    }),
    c('support', 'Close the chat and ask for help without collecting more.', 'c2_report', { stats: { energy: 5 } })
  ]);
  add('exclusion_roster', 2, 'Two versions of a roster', 'Club room · Wednesday', [
    p('Sam brings out the original signup sheet. The name was there. The updated list has no explanation for its removal, and the club’s capacity rule has not changed.'),
    d('Sam', 'I can restore the place. I also need to find out who has been editing this list, or it will happen again.'),
    p('Restoring a name is a practical step, not a demand that someone immediately feel comfortable returning. Sam offers to speak with the club adviser about access to the signup file.'),
    p('You can keep the focus on the rule instead of asking the affected student to defend their worth to the group.')
  ], [
    c('record', 'Record the difference and ask the adviser to follow up.', 'c2_record', {
      flags: { documented: true, roster_fixed: true }, facts: ['The original signup sheet includes the removed name.'],
      memories: [m('sam', 'roster', 'You helped correct the roster without staging a public argument.')]
    }),
    c('choice', 'Let the affected student decide whether to return after the place is restored.', 'c2_private', { flags: { roster_fixed: true } })
  ]);
  add('threat_safe', 2, 'The open classroom', 'Supervised classroom · Wednesday', [
    p('The teacher steps into the doorway and asks the group to separate. You sit inside, away from the stairwell. No one asks you to go back and finish the conversation.'),
    d('Teacher', 'Tell me what you need right now. We can take the next part one step at a time.'),
    p('Jules waits nearby rather than telling the story over you. You can ask them to stay, ask for privacy, or request the counselor. A written account can wait until you have space to make one.'),
    p('Moving away did not cause the incident, and staying would not have made it your responsibility to resolve.')
  ], [
    c('account', 'Give a short factual account with Jules nearby.', 'c2_record', {
      flags: { documented: true, safety_plan: true }, facts: ['A teacher intervened at the stairwell; Jules was present.'],
      memories: [m('jules', 'safety', 'You reached the supervised classroom together.')]
    }),
    c('privacy', 'Ask for privacy and a counselor before discussing details.', 'c2_report', { flags: { safety_plan: true } })
  ]);
  add('c2_record', 2, 'The note in your pocket', 'Quiet room · Wednesday', [
    p('The note is short: what happened, when, and what you know directly. You leave out guesses about people’s motives. A record can make a conversation easier, but it cannot guarantee that every adult handles it well.'),
    p('You have a private record from the incident.', f('documented')),
    d('Ms. Chen', 'We can use what you have. And if someone else needs help without a note, they still deserve to be heard.'),
    p('The next choice is whether to bring the issue to school staff now or take a break before deciding. Keeping the record private avoids making the incident a new spectacle.')
  ], [
    c('report', 'Bring the note to a private meeting with Ms. Chen.', 'c2_report'),
    c('pause', 'Keep it private and take a break before the next step.', 'c2_rest', { stats: { energy: 6 } })
  ]);
  add('c2_private', 2, 'Support without taking over', 'Library alcove · Wednesday', [
    d('Morgan', 'Would company help, or would you rather I stay nearby and give you space?', role('target')),
    p('You appreciate that the question leaves room for an honest answer. You do not have to reassure Morgan that everything is fine.', role('target')),
    d('Morgan', 'Please do not post a speech about me. You can ask what would help.', { not: role('target') }),
    p('There are practical options: company between classes, help reaching a trusted adult, or a quieter place for lunch. Support does not have to become a performance.'),
    p('You can respect someone’s privacy while still seeking help about a safety concern. The next conversation can be about what to do, not about earning praise for doing it.')
  ], [
    c('listen', 'Agree on boundaries, then ask a trusted adult about next steps.', 'c2_report', {
      flags: { privacy: true }, relationships: { morgan: 10 },
      memories: [m('morgan', 'private_support', 'You discussed what support was welcome instead of taking over.')]
    }),
    c('company', 'Choose low-pressure company and a break for now.', 'c2_rest', {
      flags: { privacy: true }, relationships: { morgan: 8 }, stats: { energy: 7 },
      memories: [m('morgan', 'company', 'You made space for company without demanding details.')]
    })
  ]);
  add('c2_boundary', 2, 'A sentence that is enough', 'Club entrance · Wednesday', [
    p('You keep the sentence short. The behavior needs to stop. You are not inviting a debate about whether the person affected is too sensitive. Riley starts to answer, then looks past you for an audience.'),
    d('Riley', 'You do not have to make a whole thing out of it.'),
    p('You do not have to win this conversation. If Riley keeps arguing, you can leave and ask staff to handle what comes next. Sam waits beside the open club door, where a teacher is checking equipment.'),
    p('Setting a boundary can be one action among several, rather than a dramatic speech that fixes the entire school.')
  ], [
    c('adult', 'End the exchange and involve the adviser.', 'c2_report', {
      flags: { boundary: true }, memories: [m('riley', 'clear_limit', 'You set a clear limit and did not stay for an argument.')]
    }),
    c('leave', 'Move away and take time to recover.', 'c2_rest', {
      flags: { boundary: true }, stats: { energy: 6 }, memories: [m('riley', 'walked_away', 'You ended the argument instead of escalating it.')]
    })
  ]);
  add('c2_harm', 2, 'After the laugh', 'Corridor · Wednesday', [
    p('For a second, joining Riley felt like an easy way to belong. Then Morgan saw what you had done. You can explain the pressure you felt without pretending it removes your responsibility.'),
    d('Jules', 'That was not helping. You can still stop.'),
    p('The game will not treat this as a secret shortcut to a good ending. It will remember the action, and characters will not have to forget it just because you choose a kinder sentence later.'),
    p('You can stop spreading the material, ask for guidance, or avoid dealing with it for now. Those choices are different.')
  ], [
    c('own', 'Stop repeating it and ask Ms. Chen how to take responsibility.', 'c2_report', {
      flags: { stopped_harm: true, wants_repair: true }, memories: [m('jules', 'stopped', 'You stopped when Jules challenged what you were doing.')]
    }),
    c('delay', 'Do not repeat it again, but postpone the conversation.', 'c2_rest', { flags: { stopped_harm: true } })
  ]);
  add('c2_report', 2, 'What happens after telling someone', 'Student support · Thursday', [
    p('Ms. Chen asks what happened and what would make the next school day safer. She does not ask you to confront Riley on your own. Together you separate immediate safety needs from the longer conversation about the school’s response.'),
    d('Ms. Chen', 'I will log this and arrange a follow-up. We should agree on how you can tell me if the behavior continues.'),
    p('You provide the private record you kept. Ms. Chen checks which details were directly witnessed.', f('documented')),
    p('You do not have a written record. Ms. Chen takes notes while you explain what you know.', not('documented')),
    p('The follow-up will arrive later in the story. It is a commitment to review action, not an instant cure. You can ask for company or a private check-in.')
  ], [
    c('plan', 'Agree on a named contact and a private follow-up.', 'c2_crossroads', reportEffect),
    c('accompany', 'Ask someone supportive to attend the follow-up with you.', 'c2_crossroads', {
      ...reportEffect, flags: { reported: true, accompanied: true }, relationships: { chen: 8 }
    })
  ]);
  add('c2_rest', 2, 'Not every hour belongs to the problem', 'Quiet space · Thursday', [
    p('You find a chair away from the busiest corridor. For a while you concentrate on something unrelated: a rhythm, a drawing, a game idea, the view through the window. The incident does not become acceptable because you take a break from it.'),
    p('Taking space now does not close off support later. You can keep a contact saved, ask someone to sit nearby, or spend this time alone. None of those choices changes who was responsible for the harm.'),
    p('The bell rings. There will be another part of the day after this one.'),
    d('Morgan', 'We do not have to talk the whole time.')
  ], [
    c('company', 'Accept quiet company.', 'c2_crossroads', { stats: { energy: 12 }, relationships: { morgan: 5 }, flags: { took_break: true } }),
    c('alone', 'Recharge alone and keep the support contact available.', 'c2_crossroads', { stats: { energy: 14 }, flags: { took_break: true, knows_office: true } })
  ]);
  add('c2_crossroads', 2, 'What you make room for', 'Campus map · Friday', [
    p('There is no single activity that turns the week into a neat lesson. The club room is open, Ms. Chen has office hours, and the library still has a quiet corner. You have time for one substantial next step, not everything at once.'),
    p('The school celebrates competition loudly, but you can choose a quieter kind of participation.', { profile: 'culture', value: 'competitive' }),
    p('The school talks about community. This is an opportunity to ask whether its actions match that language.', { profile: 'culture', value: 'supportive' }),
    p('Different groups have very different ideas about what is normal here. You do not have to accept the loudest one.', { profile: 'culture', value: 'mixed' }),
    p('This choice opens a different chapter: a shared project, a support process, a private recovery route, or a conversation about repair.')
  ], [
    c('club', 'Build something with the {{interest}} club.', clubNext, { route: 'community' }),
    c('support', 'Work on a practical support and follow-up plan.', 'c3_support', { route: 'support' }),
    c('quiet', 'Focus on boundaries, ordinary life, and a smaller circle.', 'c3_quiet', { route: 'quiet' }),
    c('repair', 'Take responsibility for harm you helped cause.', 'c3_repair', { route: 'repair' }, any(role('former'), f('harm')))
  ]);

  // CHAPTER THREE — Distinct playable activities, consent, and relationship memories.
  add('club_art', 3, 'Who gets to hang the drawing?', 'Art room · Next Monday', [
    p('Sam lays out backing paper for a small exhibition. Morgan has brought a drawing with a blank label. It is a city seen through a bus window, with the passengers reflected over the buildings.'),
    d('Sam', 'We could put everyone’s names and stories underneath. It might make the project more powerful.'),
    d('Morgan', 'Or I could just show a drawing. Not everything I make has to explain what happened.'),
    p('The practical work is right in front of you: choose a display plan, make space for contributors, and decide who controls the labels. A good intention does not give the group permission to publish someone else’s experience.')
  ], [
    c('consent', 'Use optional labels approved by each artist.', 'c3_plan', {
      flags: { project_ready: true, consent: true }, relationships: { morgan: 8, sam: 5 },
      memories: [m('morgan', 'art_consent', 'You let the artist decide how much the drawing should explain.')]
    }),
    c('anonymous', 'Create an unsigned section for work that stands on its own.', 'c3_plan', {
      flags: { project_ready: true, consent: true }, memories: [m('sam', 'anonymous', 'You helped design a display that did not require a personal story.')]
    }),
    c('rush', 'Let Sam draft personal labels without checking first.', 'c3_plan', {
      flags: { project_ready: true, consent_issue: true }, relationships: { morgan: -7 }
    })
  ]);
  add('club_games', 3, 'The playtest table', 'Computer room · Next Monday', [
    p('The club is making a tiny cooperative game. One player holds a bridge open while another crosses it. The first test goes badly: the controls are unclear, and Riley jokes that the person struggling must be stupid.'),
    d('Sam', 'Maybe the instruction is the thing that needs fixing.'),
    p('Morgan has drawn the backgrounds. Jules offers to test again if the feedback is about the game, not about them. A public leaderboard sits in a blank panel on the screen, waiting to be either built or removed.'),
    p('You can shape the activity instead of treating embarrassment as the price of participating.')
  ], [
    c('feedback', 'Use private feedback and remove the humiliating leaderboard.', 'c3_plan', {
      flags: { project_ready: true, consent: true }, relationships: { jules: 10, sam: 6 },
      memories: [m('jules', 'playtest', 'You made the playtest about improving the game, not judging the player.')]
    }),
    c('teams', 'Let players choose partners and offer a practice round.', 'c3_plan', {
      flags: { project_ready: true, consent: true }, relationships: { morgan: 6 },
      memories: [m('sam', 'practice', 'You added a low-pressure practice round to the demonstration.')]
    }),
    c('scores', 'Keep named rankings without asking the testers.', 'c3_plan', {
      flags: { project_ready: true, consent_issue: true }, relationships: { jules: -7 }
    })
  ]);
  add('club_sports', 3, 'Before the teams are picked', 'Sports hall · Next Monday', [
    p('The club is planning a short skills event, not a championship. Riley nevertheless starts picking teams in front of everybody. The same students wait until last. Sam looks at the empty signup sheet and realizes there is still time to change the format.'),
    d('Jules', 'I want to try. I do not want to be announced as the person nobody picked.'),
    p('The teacher can organize rotations and set expectations. Players can decide whether their practice results are public. The event does not need to use someone else’s embarrassment as entertainment.'),
    p('You have a clipboard, a whistle, and a chance to change an ordinary routine.')
  ], [
    c('rotate', 'Ask the teacher to organize rotations instead of public team picking.', 'c3_plan', {
      flags: { project_ready: true, consent: true }, relationships: { jules: 10 },
      memories: [m('jules', 'rotation', 'You changed the format so trying did not require a public rejection.')]
    }),
    c('practice', 'Offer open practice stations with optional scoring.', 'c3_plan', {
      flags: { project_ready: true, consent: true }, relationships: { sam: 7 },
      memories: [m('sam', 'stations', 'You helped build an event with more than one way to participate.')]
    }),
    c('publish', 'Publish named practice results without asking participants.', 'c3_plan', {
      flags: { project_ready: true, consent_issue: true }, relationships: { jules: -7 }
    })
  ]);
  add('club_music', 3, 'The microphone is optional', 'Practice room · Next Monday', [
    p('The room smells of warm amplifiers and old carpet. Sam wants the showcase song to begin with a student reading a personal account. Morgan has offered a melody, not a speech. Riley says a dramatic introduction would get more attention.'),
    d('Morgan', 'I can play the keyboard. I did not say I wanted the microphone.'),
    p('There are other ways to build the performance: an instrumental opening, a group introduction, or a recorded track approved by its contributors. You can make something meaningful without borrowing a person’s pain for an audience.'),
    p('Sam sets down the microphone and waits for a decision.')
  ], [
    c('instrumental', 'Start with the instrumental and let people choose their roles.', 'c3_plan', {
      flags: { project_ready: true, consent: true }, relationships: { morgan: 10 },
      memories: [m('morgan', 'music_role', 'You respected the difference between offering music and offering a personal story.')]
    }),
    c('group', 'Use a short group introduction that reveals no private experiences.', 'c3_plan', {
      flags: { project_ready: true, consent: true }, relationships: { sam: 8 },
      memories: [m('sam', 'group_intro', 'You found an introduction that did not pressure anyone to disclose.')]
    }),
    c('pressure', 'Agree that a personal story would make a stronger opening.', 'c3_plan', {
      flags: { project_ready: true, consent_issue: true }, relationships: { morgan: -8 }
    })
  ]);
  add('c3_support', 3, 'A plan with a date on it', 'Student support · Next Monday', [
    p('Ms. Chen brings a blank page rather than a prepared speech. You discuss contact points, supervised spaces, and what should happen if the behavior continues. She writes down who is responsible for each next step.'),
    p('Your earlier report is already on file. This meeting follows it rather than starting the same conversation from nothing.', f('reported')),
    p('This is your first formal report. You do not need to explain why you did not come sooner.', not('reported')),
    d('Ms. Chen', 'The plan should not make the person targeted do all the moving, hiding, or explaining. We need to address the behavior, too.'),
    p('You ask how to check whether the agreed actions happen. That question gives the next meeting a purpose.')
  ], [
    c('review', 'Ask for written responsibilities and a review date.', 'c3_followup', {
      ...reportEffect, flags: { reported: true, safety_plan: true },
      facts: ['The support plan names responsible staff and a review date.']
    }),
    c('companion', 'Include a trusted companion while keeping personal details private.', 'c3_followup', {
      ...reportEffect, flags: { reported: true, safety_plan: true, accompanied: true }, relationships: { chen: 7 }
    })
  ]);
  add('c3_quiet', 3, 'A life larger than the incident', 'Library · Next Monday', [
    p('You arrive with something unrelated to the conflict: {{pastime}}. The library table is big enough for two people to work without talking the whole time.'),
    d('Morgan', 'I like that we can do this. Just be here.'),
    p('A quieter route is not a lesser story. You can make boundaries, keep support available, and still care about what happens at school. You do not owe the entire community a campaign.'),
    p('Your phone lights up. {{peer}} has found a small lunchtime activity and asks whether you would like an invitation, with no expectation that you say yes.')
  ], [
    c('yes', 'Accept a low-pressure invitation, with permission to leave early.', 'c3_followup', {
      flags: { small_circle: true }, stats: { energy: 8 }, relationships: { morgan: 8 },
      memories: [m('morgan', 'quiet_company', 'You built a friendship around ordinary time together.')]
    }),
    c('no', 'Decline kindly and protect your quiet time.', 'c3_followup', {
      flags: { personal_boundary: true }, stats: { energy: 10 },
      memories: [m('morgan', 'honest_no', 'You were honest about needing space without blaming anyone.')]
    })
  ]);
  add('c3_repair', 3, 'Not a speech for an audience', 'Outside the library · Next Monday', [
    p('You write an apology and remove the parts about how bad you feel, how everyone else joined in, and how much you want things to go back to normal. What remains is shorter: what you did, why it hurt, and what you will stop doing.'),
    d('Ms. Chen', 'Ask whether contact is welcome. Changing the behavior does not have to wait for a conversation.'),
    p('Morgan may be ready to listen or may not. Their answer is not a score you can force upward by finding the perfect wording.'),
    p('You can offer a brief apology through an appropriate channel, or begin by correcting what you spread and respecting distance.')
  ], [
    c('ask', 'Ask once whether a brief apology is welcome.', [
      { when: { relationship: 'morgan', min: 45 }, next: 'c3_morgan_open' },
      { next: 'c3_morgan_no' }
    ], { flags: { repair_started: true } }),
    c('change', 'Stop the behavior and correct your part without asking for contact.', 'c3_morgan_no', {
      flags: { repair_started: true, correction: true },
      memories: [m('riley', 'correction', 'You withdrew your support for the harmful claim rather than repeating it.')]
    })
  ]);
  add('c3_morgan_open', 3, 'A few minutes, not a reset', 'Library · Next Monday', [
    d('Morgan', 'I can listen for a few minutes. That does not mean we are starting over.'),
    p('You describe your own action without naming everybody else as an excuse. Morgan does not supply a reassuring ending to your sentence. There is a long pause, and you let it stay a pause.'),
    d('Morgan', 'Do not share it again. Do not use an apology as a reason to keep messaging me.'),
    p('You can accept those boundaries and follow through. Or you can make the conversation about getting forgiveness quickly, which would miss what Morgan just asked.')
  ], [
    c('accept', 'Apologize specifically and accept the boundaries.', 'c3_followup', {
      flags: { apology: true, correction: true, respected_repair: true }, relationships: { morgan: 5 },
      memories: [m('morgan', 'apology', 'You acknowledged your action and accepted that trust takes time.')]
    }),
    c('pressure', 'Ask why Morgan cannot forgive you now.', 'c3_followup', {
      flags: { pressured: true }, relationships: { morgan: -15 },
      memories: [m('morgan', 'pressure', 'You asked for immediate forgiveness after a boundary was explained.')]
    })
  ]);
  add('c3_morgan_no', 3, 'No answer is an answer', 'Library doorway · Next Monday', [
    p('Morgan is not ready for a conversation. The message is brief and clear. It does not give you a debate to win or another way to ask the same question.'),
    p('You can still correct misinformation you spread, stop participating in harassment, and cooperate with the adults addressing it. Those actions do not depend on being thanked.'),
    d('Ms. Chen', 'Respecting a refusal is part of taking responsibility. Give your next actions time to speak for themselves.'),
    p('The library door closes softly. You decide what to do when there is no audience and no immediate reward.')
  ], [
    c('respect', 'Respect the refusal and change your behavior anyway.', 'c3_followup', {
      flags: { respected_repair: true, correction: true },
      memories: [m('morgan', 'repair_space', 'You respected the request for distance while changing your behavior.')]
    }),
    c('push', 'Send another message asking for an explanation.', 'c3_followup', {
      flags: { pressured: true }, relationships: { morgan: -10 },
      memories: [m('morgan', 'repeat_contact', 'You sent another request after Morgan asked for space.')]
    })
  ]);
  add('c3_plan', 3, 'Before the invitation goes out', 'Club room · Tuesday', [
    p('The project is almost ready. Sam has a draft invitation and a list of things that still need checking. Your choices have shaped the activity, but a public event also needs agreement about names, images, and personal details.'),
    d('Morgan', 'Can we check it together before anything goes up?'),
    p('There is a consent problem in the current plan. You can change the labels, rankings, or introduction before publishing. Revising a decision is part of the story.', f('consent_issue')),
    p('The current plan already gives contributors a choice. The next step is to make sure the published version still respects it.', f('consent')),
    p('You can promise a check-in, ask Sam to handle approval, or rush ahead. A promise made here will be remembered a few scenes later.')
  ], [
    c('promise', 'Promise to check the final plan with Morgan before publication.', 'c3_followup', {
      flags: { promised: true },
      memories: [m('morgan', 'promise', 'You promised a check-in before the event was made public.')],
      queue: [{ id: 'promise_result', after: 2, when: f('promise_kept'),
        text: 'Morgan remembers that you made time for the promised check-in, or clearly rescheduled instead of disappearing.',
        effect: { relationships: { morgan: 10 }, flags: { reliable: true } },
        otherwise: { text: 'Morgan waited for the promised check-in. The missed commitment stays part of their memory even if you acknowledge it afterward.',
          effect: { relationships: { morgan: -10 }, flags: { missed_promise: true } } }
      }]
    }),
    c('delegate', 'Ask Sam to get each contributor’s approval before publication.', 'c3_followup', {
      flags: { consent: true, consent_issue: false }, relationships: { sam: 7 },
      memories: [m('sam', 'approval', 'You made contributor approval a real step rather than an assumption.')]
    }),
    c('rush', 'Publish now and deal with objections later.', 'c3_followup', {
      flags: { consent_issue: true, published_early: true }, relationships: { morgan: -10 },
      memories: [m('morgan', 'published', 'You made the project public before checking what contributors had agreed to.')]
    })
  ]);
  add('c3_followup', 3, 'The calendar fills up', 'Campus · Wednesday', [
    p('Several things can be true at once: the work is moving, school is still tiring, and people remember what you said you would do. You check the next commitment rather than letting every notification compete for your attention.'),
    p('Ms. Chen’s follow-up message has arrived. The reporting process has a next step instead of disappearing after the first conversation.', f('followup_ready')),
    p('You promised Morgan a check-in before publication. There is time to honor it or communicate a change.', f('promised')),
    p('You did not promise a check-in. You can move forward without inventing an obligation you never agreed to.', not('promised')),
    d('{{peer}}', 'Do you want company on the way? It is okay if you already have a plan.')
  ], [
    c('keep', 'Make time for the check-in and fix any consent problem.', nextWithPromise, {
      flags: { promise_kept: true, consent: true, consent_issue: false }, stats: { energy: -3 }
    }, f('promised')),
    c('reschedule', 'Explain that you need more time; pause publication and reschedule.', nextWithPromise, {
      flags: { promise_kept: true, consent: true, consent_issue: false, rescheduled: true },
      memories: [m('morgan', 'rescheduled', 'You communicated a delay rather than letting someone wait without an explanation.')]
    }, f('promised')),
    c('continue', 'Move on to the next part of your plan.', nextWithPromise, {}, undefined,
      'You moved on without adding another commitment.')
  ]);

  // CHAPTER FOUR — Promises, reports and consent return as playable consequences.
  add('c4_kept', 4, 'A promise with a follow-through', 'Library · Thursday', [
    p('Morgan opens the draft beside you. This conversation is not a dramatic reconciliation. It is a practical check: what can be shared, what should be changed, and what somebody would rather keep private.'),
    d('Morgan', 'Thanks for not deciding for me.'),
    p('You arranged a different time rather than pretending the original plan could still happen. The delay was communicated, not concealed.', f('rescheduled')),
    p('Keeping a small commitment does not make you responsible for everything. It does give this relationship something reliable to build on. The next part of the week will bring a different decision.')
  ], [
    c('continue', 'Carry the agreed boundaries into the next step.', routeNext, {
      memories: [m('morgan', 'kept', 'You followed through on the promised approval check.')]
    })
  ]);
  add('c4_missed', 4, 'The empty chair', 'Library · Thursday', [
    p('Morgan waited at the table you had chosen. When you arrive later, the draft is still folded beside the empty chair. A message says they left for class.'),
    p('This is a consequence of a particular promise, not a judgment about your whole character. You can acknowledge what happened, offer a practical correction, and accept that Morgan may prefer someone else to handle approval.'),
    d('Sam', 'I can pause the invitation. We should not make being late turn into publishing without permission.'),
    p('The next action matters more than an elaborate excuse.')
  ], [
    c('repair', 'Acknowledge the missed check-in and pause publication.', routeNext, {
      flags: { consent: true, consent_issue: false }, relationships: { morgan: 3 },
      memories: [m('morgan', 'missed_owned', 'You acknowledged a missed promise and corrected the publication plan.')]
    }),
    c('dismiss', 'Say it was only a small promise and move on.', routeNext, {
      flags: { consent_issue: true }, relationships: { morgan: -7 },
      memories: [m('morgan', 'missed_dismissed', 'You dismissed a commitment after someone had relied on it.')]
    })
  ]);
  add('c4_support', 4, 'Checking what actually changed', 'Student support · Thursday', [
    p('At the review meeting, Ms. Chen asks about actions rather than asking whether you feel grateful. Staff have been assigned to monitor the relevant spaces and respond to further incidents. You can say which part is working and which is not.'),
    p('The private record gives the meeting a concrete starting point. It does not replace listening to what has happened since.', f('documented')),
    p('You explain the pattern in your own words. The meeting goes ahead without demanding a screenshot or a signed witness statement.', not('documented')),
    d('Ms. Chen', 'We need to follow through, not just tell someone to be resilient.'),
    p('You can refine the plan, ask for another responsible adult to join the review, or make room for an ordinary supportive conversation afterward.')
  ], [
    c('review', 'Ask who will check progress and when the next review happens.', 'c4_review', { flags: { reviewed: true } }),
    c('companion', 'Ask for company and talk with a classmate afterward.', 'c4_ally', { flags: { reviewed: true } }),
    c('pause', 'Keep the follow-up contact and take a break after the meeting.', 'c4_space', { flags: { reviewed: true }, stats: { energy: 5 } })
  ]);
  add('c4_event', 4, 'Five minutes before the doors open', 'Showcase entrance · Thursday', [
    p('The event is small enough that you can hear chairs being moved in the next room. Sam is checking the entrance list. Morgan studies the {{projectObject}} that grew from your project.'),
    d('Morgan', 'This matches what we agreed. I know what I am walking into.', f('consent')),
    d('Morgan', 'I did not agree to this part. It needs changing before people come in.', f('consent_issue')),
    p('Riley points toward the opening doors and says it is too late to change anything. It is not. You can delay a start, remove a label, or make a role optional. The time pressure does not create permission.'),
    p('The activity can still be enjoyable without making the conflict its centerpiece.')
  ], [
    c('check', 'Correct any unapproved material and check before opening.', 'c4_stage', {
      flags: { consent: true, consent_issue: false, project_safe: true }, relationships: { morgan: 5, sam: 5 }
    }),
    c('behind', 'Hand the project to Sam and offer quiet support away from the spotlight.', 'c4_ally', {
      flags: { project_safe: true, consent: true, consent_issue: false }
    }),
    c('withdraw', 'Step back from the event and ask the adviser to resolve the issue.', 'c4_space', {
      flags: { personal_boundary: true }, memories: [m('sam', 'handover', 'You handed the issue to a responsible adult instead of ignoring it.')]
    })
  ]);
  add('c4_riley', 4, 'The old invitation', 'Courtyard · Thursday', [
    p('Riley has a new story to repeat and an empty space on the bench beside them. The invitation is familiar. For a moment you remember how little explanation it used to require.'),
    d('Riley', 'You do not have to be serious all the time. Just sit down.'),
    p('Your private conversation with Morgan did not make every future decision automatic. Repair includes what you do when the same social reward is offered again.'),
    p('You do not have to persuade Riley to become a different person before you stop participating. You can set a limit, seek support, or choose another place to sit.')
  ], [
    c('limit', 'Decline the joke and correct your own earlier contribution.', 'c4_ally', {
      flags: { correction: true, stopped_harm: true },
      memories: [m('riley', 'new_boundary', 'You did not accept another invitation to repeat the harm.')]
    }),
    c('support', 'Ask staff to help address the repeated behavior.', 'c4_review', {
      flags: { reported: true, stopped_harm: true },
      memories: [m('chen', 'repair_support', 'You asked for help changing a pattern you had participated in.')]
    }),
    c('distance', 'Leave the bench and give yourself distance from the group.', 'c4_space', {
      flags: { personal_boundary: true, stopped_harm: true }, stats: { energy: 5 }
    })
  ]);
  add('c4_quiet', 4, 'An invitation without a test', 'Library steps · Thursday', [
    p('{{peer}} waits near the library steps with a spare copy of the lunch activity sheet. The invitation does not ask you to explain your week or prove you are doing better.'),
    d('{{peer}}', 'Come for ten minutes, stay longer, or skip today. It is not an audition.'),
    p('You notice how different that sounds from a place where belonging depends on laughing at the right person. You can accept the invitation and still have boundaries, or decline without losing the right to be invited another time.'),
    p('There is also time to review a support plan if you want one. Choosing a quieter route did not lock that door.')
  ], [
    c('join', 'Accept the invitation with no promise to stay all afternoon.', 'c4_ally', { flags: { small_circle: true } }),
    c('review', 'Use the time to speak with Ms. Chen instead.', 'c4_review', { flags: { reported: true } }),
    c('rest', 'Thank them and keep the afternoon quiet.', 'c4_space', { flags: { personal_boundary: true }, stats: { energy: 8 } })
  ]);
  add('c4_review', 4, 'A second question', 'Student support · Friday', [
    p('The review includes a question the first conversation could not answer: did the planned action happen? You can describe a gap without treating the whole effort as pointless.'),
    d('Ms. Chen', 'If the first response is not enough, we need another responsible person involved and a clearer next step.'),
    p('You ask for the names of the people following up and how to reach them if the situation changes. The school’s work does not end because you have told the story once.'),
    p('Before leaving, you decide whether to keep a written plan or arrange for someone supportive to help with the next conversation.')
  ], [
    c('written', 'Keep a copy of the plan and its review date.', 'c5_hub', {
      flags: { reviewed: true, safety_plan: true }, facts: ['The support plan has a named follow-up contact.'],
      memories: [m('chen', 'review', 'You asked what had actually changed and agreed on continued follow-up.')]
    }),
    c('support', 'Ask for a companion at the next review.', 'c5_hub', {
      flags: { reviewed: true, safety_plan: true, accompanied: true },
      memories: [m('chen', 'companion', 'You arranged support so you would not have to repeat everything alone.')]
    })
  ]);
  add('c4_ally', 4, 'A smaller table', 'Library café · Friday', [
    p('There are three chairs at the table and no demand that anybody fill the silence. Jules has a book. Morgan has a notebook. Sam drops off a folded program and then goes to help put chairs away.'),
    d('Morgan', 'I remember that first conversation. You let it be private.', { memory: 'morgan', tag: 'listened' }),
    d('Morgan', 'I am still keeping some distance. Being polite today is not the same as forgetting.', any(f('harm'), f('past_harm'))),
    p('Friendship does not have to be a reward screen. Sometimes the meaningful change is a place where people can say yes, no, or not today without losing their dignity.'),
    p('You can make a modest plan or leave the afternoon unpromised.')
  ], [
    c('invite', 'Offer another low-pressure lunch, with an easy way to decline.', 'c5_hub', {
      flags: { small_circle: true }, relationships: { morgan: 5, jules: 5 },
      memories: [m('jules', 'small_table', 'You helped make a small, welcoming place without a social test.')]
    }),
    c('today', 'Enjoy today without adding another obligation.', 'c5_hub', {
      stats: { energy: 8 }, flags: { personal_boundary: true }
    })
  ]);
  add('c4_space', 4, 'You are allowed an ordinary afternoon', 'Home · Friday', [
    p('Nothing dramatic happens when you close the school chat. The room remains a room. You find the thing you were working on before the week got complicated and spend a while getting back into it.'),
    p('There may still be conversations to have. Rest does not erase them, and it does not make you responsible for someone else’s behavior. It gives you a little more room to decide what comes next.'),
    p('Your support contact stays saved. You can also let someone know that you are taking time rather than silently accepting every request.'),
    p('For once, the next decision can be about your own afternoon.')
  ], [
    c('boundary', 'Set a clear limit on when you check school messages.', 'c5_hub', {
      flags: { personal_boundary: true }, stats: { energy: 10 },
      facts: ['You chose a manageable time to check school messages.']
    }),
    c('company', 'Spend time with someone supportive, without revisiting every detail.', 'c5_hub', {
      flags: { small_circle: true }, stats: { energy: 10 }
    })
  ]);
  add('c4_stage', 4, 'The thing you actually made', 'Showcase · Friday', [
    p('The doors open. Someone {{projectAction}}. For a few minutes the room is about a piece of work, not about the conflict surrounding its makers.'),
    d('Sam', 'The changes mattered. People knew what they were agreeing to.'),
    p('You kept the project open to different kinds of participation. That does not prove the school is fixed. It does show a concrete alternative to making belonging depend on somebody else being humiliated.'),
    p('When the event ends, you can help decide what should continue and what should remain a single afternoon.')
  ], [
    c('continue', 'Keep the consent and participation rules for future activities.', 'c5_hub', {
      flags: { community_change: true }, memories: [m('sam', 'event', 'You helped turn fair participation into a repeatable practice.')]
    }),
    c('credit', 'Thank contributors privately and leave the next event to others.', 'c5_hub', {
      flags: { community_change: true, personal_boundary: true },
      memories: [m('sam', 'shared_credit', 'You shared credit and did not make yourself responsible for every future event.')]
    })
  ]);

  // CHAPTER FIVE — Player-directed endings and individual relationship epilogues.
  add('c5_hub', 5, 'Before the next bell', 'Campus · Following Monday', [
    p('The school is not a different planet after two weeks. There are still late buses, unfinished projects, and people who will need to be held to their commitments. But your story now contains particular conversations, choices, and people who remember them.'),
    p('You have time for one last check-in before choosing what this chapter means for you. It is not an exam. There is no single answer that makes everyone like you or guarantees that nothing difficult happens again.'),
    p('Who, or what, deserves that time today?')
  ], [
    c('morgan', 'Check in with Morgan and respect the answer you get.', 'c5_morgan'),
    c('sam', 'Talk with Sam about what the project changed.', 'c5_sam'),
    c('chen', 'Review the next practical step with Ms. Chen.', 'c5_chen'),
    c('self', 'Read your own notes and decide what you need.', 'c5_self')
  ]);
  add('c5_morgan', 5, 'A person, not an ending', 'Library · Monday', [
    p('Morgan has started another drawing. They do not turn it toward you immediately. You ask whether this is a good time to talk and wait for the answer.'),
    d('Morgan', 'I remember you kept that check-in. It helped to know what was actually going to happen.', { memory: 'morgan', tag: 'kept' }),
    d('Morgan', 'I am glad you acknowledged the missed promise. I still need commitments to mean something.', { memory: 'morgan', tag: 'missed_owned' }),
    d('Morgan', 'I noticed you gave me space. Please keep respecting that.', { memory: 'morgan', tag: 'repair_space' }),
    d('Morgan', 'Some parts of the week were easier. Some were not. I get to have both answers.'),
    p('You do not ask for a final rating of your friendship. You listen, and let this be one conversation in a relationship that could continue beyond the game.')
  ], [
    c('listen', 'Accept the answer without asking for a happier one.', 'c5_decision', {
      memories: [m('morgan', 'final_listen', 'You let Morgan describe their experience without asking for reassurance.')]
    })
  ]);
  add('c5_sam', 5, 'What belongs in the next plan', 'Club room · Monday', [
    p('Sam is separating reusable signs from the recycling. They show you a new checklist: ask before publishing, explain participation rules, provide an easy way to decline.'),
    d('Sam', 'I used to think a good idea gave me permission to move quickly. Now I am trying to ask who gets a choice.'),
    p('The checklist draws directly on your project together.', f('project_ready')),
    p('You did not work on the showcase route this time. Sam explains the checklist rather than pretending you helped build it.', not('project_ready')),
    p('You can support a useful practice without signing up to run every event. Sam asks for one suggestion, not an indefinite commitment.')
  ], [
    c('choice', 'Suggest that contributors keep control of their names and stories.', 'c5_decision', {
      memories: [m('sam', 'last_advice', 'You encouraged consent as a normal planning step, not a special favor.')]
    })
  ]);
  add('c5_chen', 5, 'The follow-up is not the finale', 'Student support · Monday', [
    p('Ms. Chen leaves room on the page for things that are still unresolved. A school cannot mark a problem solved just because a conversation went well.'),
    d('Ms. Chen', 'Who will check the next step? How will we know if it needs changing?'),
    p('You review the plan already on file and confirm the next contact.', f('reported')),
    p('You begin a new conversation. Coming later does not make your concerns less legitimate.', not('reported')),
    p('You leave with a contact and a next step rather than a promise that nothing bad can happen. The responsibility for responding to bullying remains with the adults and the people choosing harmful behavior, not only with the student who speaks up.')
  ], [
    c('plan', 'Confirm a practical next step and a way to ask for more help.', 'c5_decision', {
      flags: { safety_plan: true, reviewed: true, reported: true },
      memories: [m('chen', 'next_step', 'You agreed on continued support rather than declaring everything finished.')]
    })
  ]);
  add('c5_self', 5, 'The notes only you read', 'Home desk · Monday', [
    p('Your journal is a sequence of specific moments, not a scorecard. You can see when you sought company, took space, asked for help, made a commitment, or acted in a way you now regret.'),
    p('A number cannot tell you what those moments mean. The next choice can recognize something unfinished without making it hopeless.'),
    p('Your personality gave you a way into the story, not a limit on the person you could become. Your appearance never decided how much dignity or support you deserved.'),
    p('You turn to a clean page. There is room for one sentence about what you want to carry forward.')
  ], [
    c('reflect', 'Choose what this chapter leaves you with.', 'c5_decision', { stats: { energy: 5 } })
  ]);
  add('c5_decision', 5, 'What continues', 'Your next chapter', [
    p('The next bell will ring whether or not every problem is resolved. Your choices have created memories, boundaries, and practical consequences. Some parts of this story remain unfinished.'),
    p('Choose the thread you want the closing scene to follow. These are directions, not medals. A quiet boundary is not a worse ending than a public project, and repair does not entitle anyone to forgiveness.'),
    p('The relationship epilogues will reflect what actually happened on your route, including missed commitments and conversations you never had.')
  ], [
    c('plan', 'Continue a practical support plan with named follow-up.', 'ending_plan', {}, f('safety_plan')),
    c('friend', 'Keep building a small, supportive circle.', 'ending_friend', {}, f('small_circle')),
    c('repair', 'Keep changing harmful behavior without demanding recognition.', 'ending_repair', {}, any(role('former'), f('harm'))),
    c('boundary', 'Protect your boundaries and make room for ordinary life.', 'ending_boundary'),
    c('community', 'Carry fair participation into the next shared project.', 'ending_community', {}, f('community_change')),
    c('unfinished', 'Acknowledge what is unresolved and leave room for another step.', 'ending_unfinished')
  ]);
  add('ending_plan', 5, 'Someone is following up', 'Ending · A practical plan', [
    p('Your next week contains a contact person, a quieter place when you need it, and a date when the school must review what it has done. That is not a magical shield. It is more concrete than being told to ignore the problem.'),
    p('You can return if the response is not enough. You do not have to bring a new crisis every time you ask for support. The plan belongs to a continuing process, not just to your willingness to keep explaining.'),
    p('Beyond the office, the corridor is still full of ordinary school noise. You walk into it knowing there is a next step, and that you do not have to invent every step alone.')
  ], [], { ending: true });
  add('ending_friend', 5, 'A place at a smaller table', 'Ending · Connection', [
    p('The table is not popular enough to become a rumor of its own. It has enough chairs, a few half-finished projects, and space for someone to say they would rather listen today.'),
    p('You did not control everybody at school. You helped make a few interactions more dependable. The people beside you remain people with their own needs, not proof that your choices were perfect.'),
    p('The next invitation comes without a test attached. You can accept, decline, or arrive a little late after class. Belonging here does not require somebody else to be left outside.')
  ], [], { ending: true });
  add('ending_repair', 5, 'The part you can change', 'Ending · Accountability', [
    p('The past remains part of the story. You cannot remove your name from it by finding the right final sentence. You can stop repeating the harm, correct what you spread, and respect the boundaries of the people affected.'),
    p('You began that work through concrete changes, even when a conversation was not welcome.', f('correction')),
    p('There is still concrete work to do. Choosing this ending is an intention, not credit for actions you have not taken.', not('correction')),
    p('You also pressured someone after they asked for space. That needs to stop; a later intention does not erase it.', f('pressured')),
    p('No forgiveness screen appears. The next part of repair happens in repeated choices, especially when nobody is watching or praising them.')
  ], [], { ending: true });
  add('ending_boundary', 5, 'A life that is still yours', 'Ending · Boundaries', [
    p('You keep the contact information, close the chat when you need to, and return to interests that do not have to explain the hardest part of your week. The story of your life is larger than this incident.'),
    p('Boundaries do not make harmful behavior acceptable. They make room for your time, energy, and choices while responsibility stays with the people who caused harm and the adults who must respond.'),
    p('You do not have to become the school’s spokesperson to deserve a safer day. Tomorrow can include support, a favorite activity, and something ordinary to look forward to.')
  ], [], { ending: true });
  add('ending_community', 5, 'The next signup sheet', 'Ending · A shared practice', [
    p('The next signup sheet has the rules printed beside it. Personal labels need approval. A practice round is optional. Taking part does not require giving up privacy or becoming somebody else’s lesson.'),
    p('These are small changes, and they still need people to maintain them. A well-run event has not solved every relationship. It has made one alternative visible and repeatable.'),
    p('You leave some tasks with Sam and the adviser rather than carrying the whole project yourself. The work can continue because it is shared, not because one student promised to fix everyone.')
  ], [], { ending: true });
  add('ending_unfinished', 5, 'Not the last page', 'Ending · Still becoming', [
    p('Some conversations did not happen. Some actions need follow-up. Some relationships remained distant. The game ends here without pretending that life must arrange those facts into a tidy moral.'),
    p('There are still choices available beyond this chapter: seek another supportive adult, acknowledge harm, respect a refusal, ask for company, take a break, or try a different way of participating.'),
    p('An unfinished ending is not a verdict on your worth. It is an honest place to stop reading, with room left for the person who keeps living afterward.')
  ], [], { ending: true });

  const book = {
    version: 'semester-1.0', title: 'After the Bell',
    chapters: ['Arrivals', 'Under the surface', 'What you choose', 'What comes back', 'What continues'],
    scenes
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = book;
  else root.BellContent = book;
})(globalThis);
