export type GivingOption = {
  title: string;
  content: string;
  href?: string;
};

export const givingOptions: GivingOption[] = [
  {
    title: 'Mailing Address',
    content: '864 Splitlog Ave., Kansas City, KS 66101',
  },
  {
    title: 'Cash App',
    content: '$GPTKCK',
  },
  {
    title: 'Givelify',
    content: 'Greater Pentecostal Temple Church',
    href: 'https://www.givelify.com/donate/MTUxODY4MQ==/selection',
  },
  {
    title: 'Razmobile',
    content: 'Give securely online',
    href: 'https://www.razmobile.com/GPTChurch',
  },
];
