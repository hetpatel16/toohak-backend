# Iteration 2 Reflection
Note: you may refer to your group contract during this reflection. It is natural to add/remove/edit requirements as you progress through the project.

| zID      | Name     |
| -------- | -------  |
| z5582621 | Kartavya |
| z5585770 | Het      |
| z5607057 | Maha     |
| z5610861 | Shahad   |

## Who worked on which features this iteration?
Iteration 1 -> Iteration 2 routes
* POST /v1/admin/auth/register: Kartavya
* POST /v1/admin/auth/login: Het
* GET /v1/admin/user/details: Kartavya
* PUT /v1/admin/user/details: Maha
* PUT /v1/admin/user/password: Het
* GET /v1/admin/quiz/list: Maha
* POST /v1/admin/quiz: Kartavya
* DELETE /v1/admin/quiz/{quizid}: Shahad
* GET /v1/admin/quiz/{quizid}: Maha
* PUT /v1/admin/quiz/{quizid}/name: Shahad
* PUT /v1/admin/quiz/{quizid}/description: Shahad
* DELETE /v1/clear: Het

New Iteration 2 routes
* POST /v2/admin/auth/logout: Het
* PUT /v1/admin/quiz/{quizid}/thumbnail: Shahad
* POST /v1/admin/quiz/{quizid}/question: Maha
* PUT /v1/admin/quiz/{quizid}/question/{questionid}: Maha
* DELETE /v1/admin/quiz/{quizid}/question/{questionid}: Kartavya

## What went well for your group this iteration?
1. managed to get all the work done well before the deadline. 
2. all group members contributed equally. also had group member help out other members even when the code wasn't the allocated function.

## What didn't go well for your group this iteration?
1. confusion about the changes already made to some files but they weren't pushed to master so other group members wouldn't know about them. (communication)
2. the provided function (dataStore.js, etc) weren't assigned to anyone in the conversion process, so there was a confusion about the imports and exports.

## What could you do better next iteration? 
1. to fix the communication part (first point) we should message on the teams chat when changes are made on files but not pushed yet. So team members are aware about the changes.
2. if there is a similar process like the conversion (.js to .ts), assign the provided function (unallocated) to group members so there aren't any confusions.