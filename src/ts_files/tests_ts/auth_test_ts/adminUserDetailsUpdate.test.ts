import request from 'sync-request-curl';
import { Response } from 'sync-request-curl';
import config from './../../../config.json';

import {
  registerUser,
  getUserDetailsBody,
  detailsUpdate,
  expectSuccessUserDetails,
  expectSuccessEmptyObj,
  expectErrorDetailsUpdate
} from './../test_helper_functions';
import { RegisterSuccessResponse, UserDetailsSuccessResponse } from '../../src_ts/interfaces';

const port = config.port;
const url = config.url;

let session: string, detailResponse: Response;
let randEmail;

describe('adminUserDetailsUpdate', () => {
  beforeEach(() => {
    request('DELETE', `${url}:${port}/v1/clear`, { timeout: 100 });
    randEmail = Math.random().toString(36).substring(2, 10);
    session = (registerUser(randEmail + '@example.com',
      'strongPassword123', 'Liam', 'Neeson') as RegisterSuccessResponse).session;
  });

  describe('Successful Return Cases', () => {
    test('Test successful return', () => {
      randEmail = Math.random().toString(36).substring(2, 10);
      detailResponse = detailsUpdate(session, randEmail +
        '@gmail.com', 'Nelson', 'Mandela');

      expectSuccessEmptyObj(detailResponse);
    });
  });

  describe('Error return Tests', () => {
    test('userId does not exist', () => {
      randEmail = Math.random().toString(36).substring(2, 10);
      detailResponse = detailsUpdate(session + 1, randEmail + '@gmail.com', 'Nelson', 'Mandela');
      expectErrorDetailsUpdate(401, detailResponse);
    });

    test('repeated email', () => {
      randEmail = Math.random().toString(36).substring(2, 10);
      const session1 = (registerUser(randEmail + '@gmail.com',
        'strongPass789', 'First', 'Last') as RegisterSuccessResponse).session;
      detailResponse = detailsUpdate(session, randEmail +
        '@gmail.com', 'Nelson', 'Mandela');
      expectErrorDetailsUpdate(400, detailResponse);
      detailResponse = detailsUpdate(session1, randEmail +
        '@gmail.com', 'Mariah', 'Carey');
    });

    test('isEmail() feature', () => {
      detailResponse = detailsUpdate(session, 'gmail.com', 'Nelson', 'Mandela');
      expectErrorDetailsUpdate(400, detailResponse);
    });

    test('invalid nameFirst - short', () => {
      randEmail = Math.random().toString(36).substring(2, 10);
      detailResponse = detailsUpdate(session, randEmail + '@gmail.com', 'N', 'Sparrow');
      expectErrorDetailsUpdate(400, detailResponse);
    });

    test('invalid nameFirst - not acceptable characters', () => {
      randEmail = Math.random().toString(36).substring(2, 10);
      detailResponse = detailsUpdate(session, randEmail + '@gmail.com', '@@@', 'Sparrow');
      expectErrorDetailsUpdate(400, detailResponse);
    });

    test('invalid nameFirst - acceptable characters but short length', () => {
      randEmail = Math.random().toString(36).substring(2, 10);
      detailResponse = detailsUpdate(session, randEmail + '@gmail.com', '-', 'Sparrow');
      expectErrorDetailsUpdate(400, detailResponse);
    });

    test('invalid nameLast - short', () => {
      randEmail = Math.random().toString(36).substring(2, 10);
      detailResponse = detailsUpdate(session, randEmail + '@gmail.com', 'Jack', 'S');
      expectErrorDetailsUpdate(400, detailResponse);
    });

    test('invalid nameLast - not acceptable characters', () => {
      randEmail = Math.random().toString(36).substring(2, 10);
      detailResponse = detailsUpdate(session, randEmail + '@gmail.com', 'Jack', '###');
      expectErrorDetailsUpdate(400, detailResponse);
    });

    test('invalid nameLast - acceptable characters but short length', () => {
      randEmail = Math.random().toString(36).substring(2, 10);
      detailResponse = detailsUpdate(session, randEmail + '@gmail.com', ' ', 'Winslet');
      expectErrorDetailsUpdate(400, detailResponse);
    });
  });

  describe('Side Effect Tests', () => {
    test.each([
      ['thisIsMyemail@outlook.com', 'John James', 'Doe'],
      ['z5607057@unsw.ad.edu.au', 'Martin', 'Scorsese'],
      ['z5555555@unsw.ad.edu.au', 'Unknown', 'Person'],
      ['88888888@outlook.com', 'Jane', 'Doe'],
    ])('Succesfully Updates all information', (email, nameFirst, nameLast) => {
      detailResponse = detailsUpdate(session, email, nameFirst, nameLast);
      const res = getUserDetailsBody(session) as UserDetailsSuccessResponse;
      expectSuccessUserDetails(res, expect.any(Number), `${nameFirst} ${nameLast}`, email);
    });
  });
});
