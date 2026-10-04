const fs = require('fs');
const file = 'src/services/outbox.worker.ts';
let code = fs.readFileSync(file, 'utf8');

const targetCatchBlock = `    } catch (dispatchError: any) {
      messageLog.status = 'failed';
      messageLog.errorCode = dispatchError.code || 'SEND_ERROR';
      messageLog.errorMessage = dispatchError.message;
      await messageLog.save().catch(() => {});
      
      throw dispatchError;
    }`;

const newCatchBlock = `    } catch (dispatchError: any) {
      const isPreDispatchError = dispatchError.name === 'SafeModeError' || 
                                 dispatchError.name === 'ValidationError' || 
                                 dispatchError.isBoom === true;

      if (isPreDispatchError) {
        messageLog.status = 'failed';
        messageLog.errorCode = dispatchError.code || 'SEND_ERROR';
        messageLog.errorMessage = dispatchError.message;
        await messageLog.save().catch(() => {});
        
        throw dispatchError;
      } else {
        const e: any = new Error(\`Ambiguous dispatch error: \${dispatchError.message}. Delivery uncertain.\`);
        e.name = 'UncertainStateError';
        throw e;
      }
    }`;

if (code.includes(targetCatchBlock)) {
    code = code.replace(targetCatchBlock, newCatchBlock);
    fs.writeFileSync(file, code);
    console.log("Replaced successfully");
} else {
    console.log("Target block not found");
}
