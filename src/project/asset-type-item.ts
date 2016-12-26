import {inject} from 'external/gs_tools/src/inject';
import {DomEvent} from 'external/gs_tools/src/event';
import {bind, customElement, EnumParser, handle, DomBridge} from 'external/gs_tools/src/webc';

import {BaseThemedElement} from 'external/gs_ui/src/common';
import {ThemeService} from 'external/gs_ui/src/theming';
import {MenuService} from 'external/gs_ui/src/tool';

import {Asset, AssetTypes} from '../data/asset';


@customElement({
  dependencies: [MenuService],
  tag: 'pa-asset-type-item',
  templateKey: 'src/project/asset-type-item',
})
export class AssetTypeItem extends BaseThemedElement {
  @bind('#name').innerText()
  private readonly nameBridge_: DomBridge<string>;

  private readonly menuService_: MenuService;

  constructor(
      @inject('theming.ThemeService') themeService: ThemeService,
      @inject('tool.MenuService') menuService: MenuService) {
    super(themeService);
    this.menuService_ = menuService;
    this.nameBridge_ = DomBridge.of<string>();
  }

  @handle(null).attributeChange('pa-data', EnumParser(AssetTypes))
  protected onDataAttributeChange_(newType: AssetTypes): void {
    this.nameBridge_.set(Asset.renderType(newType));
  }

  @handle(null).event(DomEvent.CLICK)
  protected onClicked_(): void {
    this.menuService_.hideMenu();
  }
}
