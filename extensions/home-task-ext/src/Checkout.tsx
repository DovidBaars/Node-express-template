import {
  Banner,
  useApi,
  reactExtension,
  Status,
  BlockStack,
  ChoiceList,
  Choice,
  Grid,
  Button
} from '@shopify/ui-extensions-react/checkout';
import { useState } from 'react';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <Extension />,
);

function Extension() {
  const { lines: { current: cartLines }, buyerIdentity: { customer } } = useApi();
  const id = customer?.current?.id.split('/').pop();
  if (!id) return null;
  console.log('Cart lines:', cartLines);

  const [bannerStatus, setBannerStatus] = useState<Status>('info');
  const [checkedState, setCheckedState] = useState<string | string[]>([]);

  const handleSaveForLater = async () => {
    const URL = 'https://herein-characterized-eu-sunset.trycloudflare.com' + '/api/cart-save';
    try {
      const response = await fetch(`${URL}`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: id,
          products: checkedState,
        }),
      });
      console.log('Response:', response);

      if (!response.ok) throw new Error('Network response was not ok');
      setBannerStatus('success');
    } catch (error) {
      setBannerStatus('warning')
      console.error('Failed to save cart:', error);
    }
  };

  const handleCheck = (value: string | string[]) => {
    setCheckedState(value)
    setBannerStatus('info');
  };

  return (
    <Banner title="Save your cart for later?"
      status={bannerStatus}
      collapsible
    >
      <Grid columns={['fill', 'auto']}>
        <ChoiceList
          name={'cartItems'}
          value={checkedState}
          onChange={handleCheck}>
          <BlockStack>
            {cartLines.map((line) => (
              <Choice
                id={line.quantity.toString().concat('_', line.merchandise.id.split('/').pop())}
                key={line.id}
              >
                {line.merchandise.title.concat(' - x', line.quantity.toString())}
              </Choice>))}
          </BlockStack>
        </ChoiceList>
        <Button
          onPress={handleSaveForLater}
          disabled={!checkedState.length || bannerStatus === 'success'}
        >
          {bannerStatus === 'success' ? 'Saved!' : 'Save for later'}
        </Button>
      </Grid>
    </Banner>
  );
}