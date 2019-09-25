import {
  AnyType,
  BooleanType,
  ElementWithTagType,
  HasPropertiesType,
  InstanceofType,
  NullableType,
  StringType} from 'external/gs_tools/src/check';
import { DataGraph } from 'external/gs_tools/src/datamodel';
import {
  $time,
  Graph,
  GraphTime,
  instanceId,
  nodeIn,
  nodeOut,
  NodeProvider } from 'external/gs_tools/src/graph';
import { ImmutableList } from 'external/gs_tools/src/immutable';
import { inject } from 'external/gs_tools/src/inject';
import { BooleanParser, StringParser } from 'external/gs_tools/src/parse';
import {
  attributeSelector,
  childrenSelector,
  component,
  elementSelector,
  innerTextSelector,
  onDom,
  render,
  resolveSelectors,
  shadowHostSelector } from 'external/gs_tools/src/persona';
import { BaseIdGenerator, SimpleIdGenerator } from 'external/gs_tools/src/random';

import { BaseThemedElement } from 'external/gs_ui/src/common';
import { navigateTo, Route } from 'external/gs_ui/src/routing';
import { $route } from 'external/gs_ui/src/routing/route-graph';
import { ThemeService } from 'external/gs_ui/src/theming';

import { HelperItem } from '../asset/helper-item';
import { SampleDataPicker } from '../common/sample-data-picker';
import { SampleDataService } from '../common/sample-data-service';
import { $asset } from '../data/asset-graph';
import { Asset2 } from '../data/asset2';
import { Helper2 } from '../data/helper2';
import { TemplateCompilerService } from '../data/template-compiler-service';
import { RouteFactoryService } from '../routing/route-factory-service';
import { Views } from '../routing/views';


type HelperIdParams = {assetId: string, helperId: string, projectId: string };
type ConsoleEntry = {command: string, isError: boolean, result: string};
type HelperViewRoute = Route<Views, {assetId: string, helperId: string, projectId: string}>;

export function argsChildrenFactory(document: Document): HTMLDivElement {
  return document.createElement('div');
}

export function argsChildrenGetter(element: HTMLDivElement): string {
  return element.textContent || '';
}

export function argsChildrenSetter(label: string, element: HTMLDivElement): void {
  element.textContent = label;
}

export function consoleChildrenFactory(document: Document): HTMLDivElement {
  const root = document.createElement('div');
  root.classList.add('consoleEntry');
  const command = document.createElement('div');
  command.classList.add('gs-theme-invert');
  const result = document.createElement('div');
  root.appendChild(command);
  root.appendChild(result);
  return root;
}

export function consoleChildrenGetter(element: HTMLDivElement): ConsoleEntry | null {
  const command = element.children.item(0).textContent;
  const isError = element.children.item(1).classList.contains('error');
  const result = element.getAttribute('pa-result');
  if (command === null || result === null) {
    return null;
  }
  return {command, isError, result};
}

export function consoleChildrenSetter(data: ConsoleEntry, element: HTMLDivElement): void {
  element.setAttribute('pa-result', data.result);
  element.children.item(0).textContent = data.command;

  const resultEl = element.children.item(1);
  const list = ImmutableList
      .of(data.result.split('\n'))
      .map((line: string) => {
        return line.replace(/ /g, '&nbsp;');
      })
      .map((line: string) => {
        return `<p>${line}</p>`;
      });
  resultEl.innerHTML = [...list].join('');
  resultEl.classList.toggle('error', data.isError);
}

export function helperChildrenFactory(document: Document): HTMLElement {
  return document.createElement('pa-asset-helper-item');
}

export function helperChildrenGetter(element: Element): HelperIdParams | null {
  const helperId = element.getAttribute('helper-id');
  const assetId = element.getAttribute('asset-id');
  const projectId = element.getAttribute('project-id');

  if (assetId === null || helperId === null || projectId === null) {
    return null;
  }

  return {assetId, helperId, projectId};
}

export function helperChildrenSetter(helperIdParams: HelperIdParams, element: Element): void {
  element.setAttribute('helper-id', helperIdParams.helperId);
  element.setAttribute('asset-id', helperIdParams.assetId);
  element.setAttribute('project-id', helperIdParams.projectId);
}

const $ = resolveSelectors({
  argInput: {
    el: elementSelector('#argInput', ElementWithTagType('gs-text-input')),
    inValue: attributeSelector(
        elementSelector('argInput.el'),
        'in-value',
        StringParser,
        StringType,
        ''),
    outValue: attributeSelector(
        elementSelector('argInput.el'),
        'out-value',
        StringParser,
        StringType,
        ''),
  },
  args: {
    children: childrenSelector(
        elementSelector('args.el'),
        argsChildrenFactory,
        argsChildrenGetter,
        argsChildrenSetter,
        StringType,
        InstanceofType(HTMLDivElement),
        {start: 0, end: 1}),
    el: elementSelector('#args', InstanceofType(HTMLDivElement)),
  },
  bodyInput: {
    el: elementSelector('#bodyInput', ElementWithTagType('gs-code-input')),
    inValue: attributeSelector(
        elementSelector('bodyInput.el'),
        'in-value',
        StringParser,
        StringType,
        ''),
    outValue: attributeSelector(
        elementSelector('bodyInput.el'),
        'out-value',
        StringParser,
        StringType,
        ''),
  },
  console: {
    children: childrenSelector(
        elementSelector('console.el'),
        consoleChildrenFactory,
        consoleChildrenGetter,
        consoleChildrenSetter,
        HasPropertiesType({
          command: StringType,
          isError: BooleanType,
          result: StringType,
        }),
        InstanceofType(HTMLDivElement)),
    el: elementSelector('#console', InstanceofType(HTMLDivElement)),
  },
  consoleContainer: {
    el: elementSelector('#consoleContainer', InstanceofType(HTMLDivElement)),
  },
  consoleInput: {
    el: elementSelector('#consoleInput', ElementWithTagType('gs-text-input')),
    inValue: attributeSelector(
        elementSelector('consoleInput.el'),
        'in-value',
        StringParser,
        StringType,
        ''),
    outValue: attributeSelector(
        elementSelector('consoleInput.el'),
        'out-value',
        StringParser,
        StringType,
        ''),
  },
  createButton: {
    el: elementSelector('#createButton', ElementWithTagType('gs-basic-button')),
  },
  executeButton: {
    el: elementSelector('#executeButton', ElementWithTagType('gs-basic-button')),
  },
  helpers: {
    children: childrenSelector(
        elementSelector('helpers.el'),
        helperChildrenFactory,
        helperChildrenGetter,
        helperChildrenSetter,
        NullableType(HasPropertiesType({
          assetId: StringType,
          helperId: StringType,
          projectId: StringType,
        })),
        ElementWithTagType('pa-asset-helper-item')),
    el: elementSelector('#helpers', InstanceofType(HTMLDivElement)),
  },
  host: {
    el: shadowHostSelector,
    viewActive: attributeSelector(
        elementSelector('host.el'),
        'gs-view-active',
        BooleanParser,
        BooleanType,
        false),
  },
  name: {
    el: elementSelector('#name', InstanceofType(HTMLDivElement)),
    innerText: innerTextSelector(
        elementSelector('name.el'),
        StringParser,
        StringType),
  },
  sampleDataPicker: {
    assetId: attributeSelector(
        elementSelector('sampleDataPicker.el'),
        'asset-id',
        StringParser,
        StringType,
        ''),
    el: elementSelector('#sampleDataPicker', ElementWithTagType('pa-sample-data-picker')),
    projectId: attributeSelector(
        elementSelector('sampleDataPicker.el'),
        'project-id',
        StringParser,
        StringType,
        ''),
  },
});

const $$ = {
  asset: instanceId('asset', NullableType(InstanceofType(Asset2))),
  helper: instanceId('helper', NullableType(InstanceofType(Helper2))),
  matchRoute: instanceId('matchRoute', AnyType<HelperViewRoute>()),
};

/**
 * Helper view
 */
@component({
  dependencies: [
    HelperItem,
    SampleDataPicker,
    SampleDataService,
    TemplateCompilerService,
  ],
  inputs: [
    $.argInput.outValue,
    $.bodyInput.outValue,
    $.consoleInput.outValue,
  ],
  tag: 'pa-asset-helper-view',
  templateKey: 'src/asset/helper-view',
})
export class HelperView extends BaseThemedElement {
  private readonly argInputInValueProvider_: NodeProvider<string> =
      Graph.createProvider($.argInput.inValue.getId(), '', this);
  private readonly argsProvider_: NodeProvider<ImmutableList<string>> =
      Graph.createProvider($.args.children.getId(), ImmutableList.of([]), this);
  private readonly consoleChildrenProvider_: NodeProvider<ImmutableList<ConsoleEntry | null>> =
      Graph.createProvider($.console.children.getId(), ImmutableList.of([]), this);
  private readonly helperIdGenerator_: BaseIdGenerator = new SimpleIdGenerator();

  constructor(
      @inject('pa.routing.RouteFactoryService')
          private readonly routeFactoryService_: RouteFactoryService,
      @inject('pa.common.SampleDataService')
          private readonly sampleDataService_: SampleDataService,
      @inject('pa.data.TemplateCompilerService')
          private readonly templateCompilerService_: TemplateCompilerService,
      @inject('theming.ThemeService') themeService: ThemeService) {
    super(themeService);
  }

  /**
   * Creates a new helper object.
   */
  private async createHelper_(time: GraphTime): Promise<Helper2 | null> {
    const [asset, assetGraph] = await Promise.all([
      Graph.get($$.asset, time, this),
      Graph.get($asset, time),
    ]);
    if (!asset) {
      return null;
    }

    const existingHelperIds = asset
        .getHelpers()
        .values()
        .mapItem((helper: Helper2) => {
          return helper.getId();
        });
    const newHelperId = this.helperIdGenerator_.generate([...existingHelperIds]);
    const helper = Helper2.withId(newHelperId);
    await assetGraph.set(
        asset.getId(),
        asset.setHelpers(
            asset.getHelpers().set(
                newHelperId,
                helper)));

    this.navigateToHelper_(asset, helper);
    return helper;
  }

  private navigateToHelper_(asset: Asset2, helper: Helper2): void {
    navigateTo(
        this.routeFactoryService_.helper(),
        {
          assetId: asset.getId(),
          helperId: helper.getId(),
          projectId: asset.getProjectId(),
        });
  }

  @onDom.event($.args.el, 'click')
  async onArgClick_(event: MouseEvent): Promise<void> {
    const time = Graph.getTimestamp();
    const target = event.target;
    if (!(target instanceof HTMLDivElement)) {
      return;
    }

    const argValue = argsChildrenGetter(target);
    if (!argValue) {
      return;
    }

    const args = await Graph.get($.args.children.getId(), time, this);
    this.argsProvider_(args.delete(argValue));
  }

  @onDom.attributeChange($.argInput.outValue)
  async onArgInputOutValueChange_(): Promise<void> {
    const time = Graph.getTimestamp();
    const [newValue, existingArgs] = await Promise.all([
      Graph.get($.argInput.outValue.getId(), time, this),
      Graph.get($.args.children.getId(), time, this),
    ]);
    const commaIndex = newValue.indexOf(',');
    if (commaIndex >= 0) {
      const newArgs = ImmutableList
          .of(newValue.split(','))
          .map((arg: string) => {
            return arg.trim();
          })
          .filter((arg: string) => {
            return arg.length > 0;
          });

      this.argsProvider_(existingArgs.addAll(newArgs));
      this.argInputInValueProvider_('');
    }
  }

  @onDom.children($.args.children)
  @onDom.attributeChange($.bodyInput.outValue)
  async onAssetUpdated_(): Promise<void> {
    const time = Graph.getTimestamp();
    const [args, body, asset, helper, assetGraph] = await Promise.all([
      Graph.get($.args.children.getId(), time, this),
      Graph.get($.bodyInput.outValue.getId(), time, this),
      Graph.get($$.asset, time, this),
      Graph.get($$.helper, time, this),
      Graph.get($asset, time),
    ]);

    if (helper === null || asset === null) {
      return;
    }

    assetGraph.set(
        asset.getId(),
        asset.setHelpers(
            asset.getHelpers()
                .set(
                    helper.getId(),
                    helper
                        .setArgs(args)
                        .setBody(body))));
  }

  @onDom.event($.createButton.el, 'click')
  async onCreateButtonClick_(): Promise<void> {
    const time = Graph.getTimestamp();
    const asset = await Graph.get($$.asset, time, this);
    if (asset === null) {
      return;
    }

    await this.createHelper_(time);
  }

  @onDom.event($.executeButton.el, 'click')
  async onExecuteButtonClick_(): Promise<void> {
    const time = Graph.getTimestamp();
    const [consoleValue, consoleEntries, containerEl, asset, rowData] = await Promise.all([
      Graph.get($.consoleInput.outValue.getId(), time, this),
      Graph.get($.console.children.getId(), time, this),
      Graph.get($.consoleContainer.el.getId(), time, this),
      Graph.get($$.asset, time, this),
      this.sampleDataService_.getRowData(),
    ]);

    if (!consoleValue || !asset || !rowData) {
      return;
    }

    const compiler = await this.templateCompilerService_.create2(asset, rowData);
    if (compiler === null) {
      return;
    }

    let result;
    let isError;
    try {
      result = compiler.compile(consoleValue);
      isError = false;
    } catch (e) {
      if (!(e instanceof Error)) {
        return;
      }
      result = `${e.message}\n\n${e.stack}`;
      isError = true;
    }

    this.consoleChildrenProvider_(
        consoleEntries.add({command: consoleValue, isError: isError, result: result}));

    containerEl.scrollTop = containerEl.scrollHeight;
  }

  @nodeOut($$.asset)
  async providesAsset(
      @nodeIn($$.matchRoute) route: HelperViewRoute | null,
      @nodeIn($asset) assetGraph: DataGraph<Asset2>): Promise<Asset2 | null> {
    if (route === null) {
      return null;
    }

    const params = route.params;
    return assetGraph.get(params.assetId);
  }

  @nodeOut($$.helper)
  async providesHelper(
      @nodeIn($$.asset) asset: Asset2 | null,
      @nodeIn($$.matchRoute) route: HelperViewRoute | null,
      @nodeIn($time) time: GraphTime): Promise<Helper2 | null> {
    if (asset === null) {
      return null;
    }

    if (route === null) {
      return null;
    }

    const helpers = asset.getHelpers();
    const helper = helpers.get(route.params.helperId);
    if (helper) {
      return helper;
    }

    // TODO: THIS SECTION IS BAD
    if (helpers.size() > 0) {
      // Pick an arbitrary helper an navigate to it.
      const pickedHelper = [...helpers.values()][0];
      this.navigateToHelper_(asset, pickedHelper);
      return pickedHelper;
    }

    // There are no helpers. So create a new one.
    return this.createHelper_(time);
  }

  @nodeOut($$.matchRoute)
  providesMatchRoute(
      @nodeIn($route.match) match: Route<Views, any> | null): HelperViewRoute | null {
    if (!match) {
      return null;
    }

    if (match.type !== Views.HELPER) {
      return null;
    }

    return match;
  }

  @render.attribute($.bodyInput.inValue)
  renderBodyInputInValue(@nodeIn($$.helper) helper: Helper2): string {
    if (!helper) {
      return '';
    }
    return helper.getBody();
  }

  @render.children($.helpers.children)
  renderHelperChildren_(
      @nodeIn($$.asset) asset: Asset2 | null,
      @nodeIn($$.helper) helper: Helper2 | null): ImmutableList<HelperIdParams> {
    if (asset === null) {
      return ImmutableList.of([]);
    }

    let helpers: ImmutableList<Helper2>;
    if (helper === null) {
      helpers = ImmutableList.of(asset.getHelpers().values());
    } else {
      const otherHelpers = asset
          .getHelpers()
          .values()
          .filterItem((value: Helper2) => {
            return value.getId() !== helper.getId();
          });
      helpers = ImmutableList.of([helper]).addAll(otherHelpers);
    }

    return helpers
        .map((helper: Helper2) => {
          return {
            assetId: asset.getId(),
            helperId: helper.getId(),
            projectId: asset.getProjectId(),
          };
        });
  }

  @render.innerText($.name.innerText)
  renderName_(@nodeIn($$.helper) helper: Helper2 | null): string {
    return helper ? helper.getName() : '';
  }

  @render.attribute($.sampleDataPicker.assetId)
  renderSampleDataPickerAssetId_(@nodeIn($$.asset) asset: Asset2 | null): string {
    return asset ? asset.getId() : '';
  }

  @render.attribute($.sampleDataPicker.projectId)
  renderSampleDataPickerProjectId_(@nodeIn($$.asset) asset: Asset2 | null): string {
    return asset ? asset.getProjectId() : '';
  }
}
