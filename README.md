### Running the fetch news and berttopic

1. install the packages from requirements.txt 'pip install -r requirements.txt ' and necessary npm installs

2. An example call for the functionality is located in the api/testFetch under route.ts

3. Functions:
   * fetchAndStoreNews(): fetch the news through newsapi, update the news_articles and news_profiles table
   * prob_embed(): gatheres all the news from the current table and create topic probability calculated by berttopic
                 **supports both GPT and berttopic as the probability prediction** (change in Topic_prediction function)
