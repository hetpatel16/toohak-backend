```javascript
let data = {
  
  users: [
    {
      userId: 1,
      nameFirst: 'Rani',
      nameLast: 'Jiang',
      email: 'ranivorous@gmail.com',
      password: 'securepassword123',
      numSuccessfulLogins: 3,
      numFailedPasswordsSinceLastLogin: 1,
    }
  ],
  quizzes: [
    {
      quizId: 1,
      userId: 1,              //is the ownerId for quiz
      name: 'My Quiz',
      description: 'This is my quiz',
      timeCreated: 1683125870,
      timeLastEdited: 1683125871,
      
    }
  ]
}

