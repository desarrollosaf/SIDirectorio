import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'home',
    link: '/dashboard'
  },
  {
    label: 'Apps',
    icon: 'mail',
    subMenus: [
      {
        subMenuItems: [
          {
            label: 'Email',
            isTitle: true,
          },
          {
            label: 'Inbox',
            link: '/apps/email/inbox'
          },
          {
            label: 'Read',
            link: '/apps/email/read'
          },
          {
            label: 'Compose',
            link: '/apps/email/compose'
          },
        ]
      },
      {
        subMenuItems: [
          {
            label: 'Other',
            isTitle: true,
          },
          {
            label: 'Chat',
            link: '/apps/chat',
          },
          {
            label: 'Calendar',
            link: '/apps/calendar',
            badge: {
              variant: 'primary',
              text: 'Event',
            }
          },
        ]
      }
    ]
  },
  {
    label: 'UI Kit',
    icon: 'feather',
    isMegaMenu: true,
    subMenus: [
      {
        subMenuItems: [
          {
            label: 'Basic',
            isTitle: true,
          },
          {
            label: 'Accordion',
            link: '/ui-components/accordion',
          },
          {
            label: 'Alerts',
            link: '/ui-components/alerts',
          },
          {
            label: 'Badges',
            link: '/ui-components/badges',
          },
          {
            label: 'Breadcrumbs',
            link: '/ui-components/breadcrumbs',
          },
          {
            label: 'Buttons',
            link: '/ui-components/buttons',
          },
          {
            label: 'Button group',
            link: '/ui-components/button-group',
          },
          {
            label: 'Cards',
            link: '/ui-components/cards',
          },
          {
            label: 'Carousel',
            link: '/ui-components/carousel',
          },
          {
            label: 'Collapse',
            link: '/ui-components/collapse',
          },
        ]
      },
      {
        subMenuItems: [
          {
            label: 'Datepicker',
            link: '/ui-components/datepicker',
          },
          {
            label: 'Dropdowns',
            link: '/ui-components/dropdowns',
          },
          {
            label: 'List group',
            link: '/ui-components/list-group',
          },
          {
            label: 'Media object',
            link: '/ui-components/media-object',
          },
          {
            label: 'Modal',
            link: '/ui-components/modal',
          },
          {
            label: 'Navs',
            link: '/ui-components/navs',
          },
          {
            label: 'Offcanvas',
            link: '/ui-components/offcanvas',
          },
          {
            label: 'Pagination',
            link: '/ui-components/pagination',
          },
          {
            label: 'Popovers',
            link: '/ui-components/popovers',
          },
          {
            label: 'Progress',
            link: '/ui-components/progress',
          },
        ]
      },
      {
        subMenuItems: [
          {
            label: 'Rating',
            link: '/ui-components/rating',
          },
          {
            label: 'Scrollbar',
            link: '/ui-components/scrollbar',
          },
          {
            label: 'Spinners',
            link: '/ui-components/spinners',
          },
          {
            label: 'Table',
            link: '/ui-components/table',
          },
          {
            label: 'Timepicker',
            link: '/ui-components/timepicker',
          },
          {
            label: 'Tooltips',
            link: '/ui-components/tooltips',
          },
          {
            label: 'Typeadhed',
            link: '/ui-components/typeahead',
          },
        ]
      },
      {
        subMenuItems: [
          {
            label: 'Advanced UI',
            isTitle: true
          },
          {
            label: 'Cropper',
            link: '/advanced-ui/cropper',
          },
          {
            label: 'Owl carousel',
            link: '/advanced-ui/owl-carousel',
          },
          {
            label: 'SortableJs',
            link: '/advanced-ui/sortablejs',
          },
          {
            label: 'Sweet alert',
            link: '/advanced-ui/sweet-alert',
          },
        ]
      }
    ]
  },
  {
    label: 'Forms',
    icon: 'file-text',
    subMenus: [
      {
        subMenuItems: [
          {
            label: 'Forms',
            isTitle: true
          },
          {
            label: 'Basic elements',
            link: '/forms/basic-elements'
          },
          {
            label: 'Editors',
            link: '/forms/editors'
          },
          {
            label: 'Wizard',
            link: '/forms/wizard'
          },
        ]
      },
      {
        subMenuItems: [
          {
            label: 'Advanced elements',
            isTitle: true
          },
          {
            label: 'Ngx-custom-validators',
            link: '/forms/advanced/ngx-custom-validators'
          },
          {
            label: 'Ngx-mask',
            link: '/forms/advanced/ngx-mask'
          },
          {
            label: 'Ng-select',
            link: '/forms/advanced/ng-select'
          },
          {
            label: 'Ngx-chips',
            link: '/forms/advanced/ngx-chips'
          },
          {
            label: 'Ngx-color-picker',
            link: '/forms/advanced/ngx-color-picker'
          },
          {
            label: 'Ngx-dropzone',
            link: '/forms/advanced/ngx-dropzone-wrapper'
          },
        ]
      }
    ]
  },
  {
    label: 'Data',
    icon: 'pie-chart',
    subMenus: [
      {
        subMenuItems: [
          {
            label: 'Charts',
            isTitle: true
          },
          {
            label: 'ApexCharts',
            link: '/charts/apexcharts',
          },
          {
            label: 'ChartJs',
            link: '/charts/chartjs',
          }
        ]
      },
      {
        subMenuItems: [
          {
            label: 'Tables',
            isTitle: true
          },
          {
            label: 'Basic tables',
            link: '/tables/basic-tables',
          },
          {
            label: 'Ngx-datatable',
            link: '/tables/ngx-datatable'
          }
        ]
      }
    ]
  },
  {
    label: 'Icons',
    icon: 'smile',
    subMenus: [
      {
        subMenuItems: [
          {
            label: 'Feather icons',
            link: '/icons/feather-icons',
          },
        ]
      }
    ]
  },
  {
    label: 'Special pages',
    icon: 'book',
    isMegaMenu: true,
    subMenus: [
      {
        subMenuItems: [
          {
            label: 'Special pages',
            isTitle: true
          },
          {
            label: 'Blank page',
            link: '/general/blank-page',
          },
          {
            label: 'Faq',
            link: '/general/faq',
          },
          {
            label: 'Invoice',
            link: '/general/invoice',
          },
        ]
      },
      {
        subMenuItems: [
          {
            label: 'Profile',
            link: '/general/profile',
          },
          {
            label: 'Pricing',
            link: '/general/pricing',
          },
          {
            label: 'Timeline',
            link: '/general/timeline',
          }
        ]
      },
      {
        subMenuItems: [
          {
            label: 'Auth pages',
            isTitle: true
          },
          {
            label: 'Login',
            link: '/auth/login',
          },
          {
            label: 'Register',
            link: '/auth/register',
          },
        ]
      },
      {
        subMenuItems: [
          {
            label: 'Error pages',
            isTitle: true
          },
          {
            label: '404',
            link: '/error/404',
          },
          {
            label: '500',
            link: '/error/500',
          },
        ]
      }
    ]
  }
];
