/* eslint-disable @typescript-eslint/no-unused-vars */
import { type DataCache, type RuleConfig, type RuleRequest, type RuleResult } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import {
  DatabaseManagerMock,
  determineOutcome,
  LoggerServiceMock,
  MockDatabaseManagerFactory,
  MockLoggerServiceFactory,
} from '@tazama-lf/frms-coe-lib/lib/tests/mocks';
import { handleTransaction, RuleExecutorConfig } from '../../src/rule';

const getRuleConfig = (): RuleConfig => {
  return {
    id: 'amount102@1.0.0',
    cfg: '1.0.0',
    desc: 'Certain amount transaction',
    config: {
      bands: [
        {
          reason: 'Amount should not be exceed by 10000',
          lowerLimit: 10000,
          subRuleRef: '.01',
        },
        {
          reason: 'If amount greater than 5000 then it will be suspecious.',
          lowerLimit: 5000,
          subRuleRef: '.02',
          upperLimit: 10000,
        },
        {
          reason: 'Amount is in normal transaction.',
          subRuleRef: '.03',
          upperLimit: 5000,
        },
      ],
      parameters: {
        maxQueryRange: 86400000,
      },
      exitConditions: [
        {
          reason: 'Incoming transaction is unsuccessful',
          subRuleRef: '.x00',
        },
      ],
    },
    creDtTm: '2026-05-04T11:40:00Z',
    updDtTm: '2026-05-04T11:40:00Z',
    tenantId: 'DEFAULT',
  };
};

const getMockRequest = (): RuleRequest => {
  const quote = {
    transaction: JSON.parse(
      `{"TxTp":"amount102","Payload":{"MsgId":"msg102","Payload":{"DOB":"10-10-1995","cnic":"1234-5678-910","MsgId":"msg102","amount":100000,"country":"PK","cretDtm":"2025-05-05","currency":"PKR"}},"TenantId":"DEFAULT"}`,
    ),
    networkMap: JSON.parse(
      '{"cfg":"1.0.0","name":"Public Network Map","active":true,"creDtTm":"2026-04-08T00:00:00.000Z","updDtTm":"2026-04-08T00:00:00.000Z","messages":[{"id":"004@1.0.0","cfg":"1.0.0","txTp":"pacs.002.001.12","typologies":[{"id":"typology-processor@1.0.0","cfg":"999@1.0.0","rules":[{"id":"EFRuP@1.0.0","cfg":"none"},{"id":"901@1.0.0","cfg":"1.0.0"},{"id":"902@1.0.0","cfg":"1.0.0"}],"tenantId":"DEFAULT"}]},{"id":"005@1.0.0","cfg":"1.0.0","txTp":"cases","typologies":[{"id":"non-pacs-typology-processor@1.0.0","cfg":"nptp@1.0.0","rules":[{"id":"EFRuP@1.0.0","cfg":"none"},{"id":"amount@1.0.0","cfg":"1.0.0"},{"id":"cnic@1.0.0","cfg":"1.0.0"},{"id":"country-case@1.0.0","cfg":"1.0.0"}],"tenantId":"DEFAULT"}]},{"id":"006@1.0.0","cfg":"1.0.0","txTp":"bhai","typologies":[{"id":"bhai-typology-processor@1.0.0","cfg":"bhai@1.0.0","rules":[{"id":"EFRuP@1.0.0","cfg":"none"},{"id":"fable-amount@1.0.0","cfg":"1.0.0"}],"tenantId":"DEFAULT"}]},{"id":"007@1.0.0","cfg":"1.0.0","txTp":"personality","typologies":[{"id":"personality-typology-processor@1.0.0","cfg":"pa@1.0.0","rules":[{"id":"EFRuP@1.0.0","cfg":"none"},{"id":"DEFAULT-Age@1.0.0","cfg":"1.0.0"}],"tenantId":"DEFAULT"}]}],"tenantId":"DEFAULT"}',
    ),
    DataCache: JSON.parse(
      '{}',
    ),
  };
  return quote;
};

const getMockRequestUnsuccessful = (): RuleRequest => {
  const quote = getMockRequest();
  quote.transaction.FIToFIPmtSts.TxInfAndSts.TxSts = 'RJCT';
  return quote;
};

const ruleResult: RuleResult = {
  id: '021@1.0.0',
  cfg: '1.0.0',
  tenantId: 'DEFAULT',
  subRuleRef: '.err',
  reason: 'Unhandled rule result outcome',
};


const dataCache: DataCache = {
  dbtrId: 'dbtr_516c7065d75b4fcea6fffb52a9539357',
  cdtrId: 'cdtr_b086a1e193794192b32c8af8550d721d',
  dbtrAcctId: 'dbtrAcct_1fd08e408c184dd28cbaeef03bff1af5',
  cdtrAcctId: 'cdtrAcct_d531e1ba4ed84a248fe26617e79fcb64',
};

let databaseManager: DatabaseManagerMock<RuleExecutorConfig>;

let loggerService: LoggerServiceMock;
describe('Rule 021 Test', () => {
beforeEach(() => {
        loggerService = MockLoggerServiceFactory();
        loggerService.resetMock();
        databaseManager = MockDatabaseManagerFactory<RuleExecutorConfig>();
        databaseManager.resetMock();
  });
  describe('handleTransaction', () => {
    describe('Exit Conditions', () => {
let dataCache: DataCache;
        let req: RuleRequest;
beforeEach(() => {
        dataCache = {
            dbtrId: 'dbtr_516c7065d75b4fcea6fffb52a9539357',
            cdtrId: 'cdtr_b086a1e193794192b32c8af8550d721d',
            dbtrAcctId: 'dbtrAcct_1fd08e408c184dd28cbaeef03bff1af5',
            cdtrAcctId: 'cdtrAcct_d531e1ba4ed84a248fe26617e79fcb64',
        };
        req = getMockRequest();
      });
test('No RuleConfig - bands', async () => {
        const dbData = [1];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        const rConfig = getRuleConfig();
        rConfig.config.bands = undefined;
        try {
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Invalid config provided - bands not provided');
        }
      });
test('No exit conditions', async () => {
        const dbData = [1, 2, 3];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        try {
          const rConfig = getRuleConfig();
          rConfig.config.exitConditions = undefined;
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Invalid config provided - exitConditions not provided');
        }
      });
test('No tolerance', async () => {
        // Mocking the request of getting oldes transation timestamp
        const dbData = [1, 2, 3];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        try {
          const rConfig = getRuleConfig();
          rConfig.config.parameters!.tolerance = undefined;
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Invalid config provided - tolerance parameter not provided or invalid type');
        }
      });
test('No tolerance - not number', async () => {
        const dbData = [1, 2, 3];
        databaseManager._eventHistory.query.mockResolvedValue({
          rows: [
            ...dbData.map((x) => ({
              Amt: x,
            })),
          ],
        });
        try {
          const rConfig = getRuleConfig();
          rConfig.config.parameters!.tolerance = 'zero point two';
          await handleTransaction(req, determineOutcome, ruleResult, loggerService, rConfig, databaseManager);
        } catch (error) {
          expect((error as Error).message).toBe('Invalid config provided - tolerance parameter not provided or invalid type');
        }
      });
    });
  });
});